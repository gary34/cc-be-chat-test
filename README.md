### 运行

运行前请确保在本机安装有redis 并监听6379端口，mongodb 并监听27017端口，zookeeper 2181 端口

```bash
#安装依赖包
npm install 
#写入测试数据
npm run seed
```


![](http://gary-public.oss-cn-chengdu.aliyuncs.com/cc-chat/seed.png?OSSAccessKeyId=LTAI4FqDKcXJ4YjuV1yrLo8g&Expires=1608277856&Signature=7wIbetdhsGSX3skS5799FHnR7SI%3D)



```bash
#启动服务器
pm2 start ecosystem.config.js
```



![](http://gary-public.oss-cn-chengdu.aliyuncs.com/cc-chat/pm2-start.png?OSSAccessKeyId=LTAI4FqDKcXJ4YjuV1yrLo8g&Expires=1584943801&Signature=CY8TCVlvDMdHms7pjEy9iu4pMjw%3D)



```bash
# 启动客户端
npm run client
```



点击查看[演示Demo视频](https://share.weiyun.com/5WNH8eq)



### Server Framework

![Alt text](http://assets.processon.com/chart_image/5e4fc9cde4b069f82a0ad054.png)

如图所示，应用由三个角色组成

*   Gateway 固定域名和端口，负责向客户端返回可用服务器列表。用户根据可用列表连接聊天服务器。
*   Leader  聊天群主节点，负载观察Follower的状态，传递服务器直接消息，维护聊天室等,。同时也可以作为普通服务器和用户直接连接。Leader 只能有一台服务器，当Leader下线时可以通过Follower选举产生。
*   Follower 聊天服务器工作节点，主要负责与用户交互。Follower可以有多台。

    > Leader 和 Follower的端口可以设置动态绑定，在开发的时候比较方便联调。生产环境为了安全还是要设置为固定端口。

### 第三方依赖

* Zookeeper 支持集群leader选举，节点注册，与每个聊天节点保持心跳连接，当有服务器增加或减少。ZK会通知所有节点。如果Follower变更，则leader会更新服务器列表到Redis，Gateway读取Redis中服务器列表通过负载均衡策略返回给客户端。如果Leader变更，Follower会尝试注册为Leader，当然ZK能够保证只有一个Follower注册成功。新的Leader会自动履行Leader的能力。
* Redis 维护全局session， 具体session策略会在后面说到。维护热词排行榜。保存最近聊天记录等。
* MongoDB 保存用户信息，聊天室信息、聊天记录等持久化数据。

### 使用的NPM包

- ava 单元测试
- colors 对不同级别的日志输出不同的颜色
- Inquirer 接受用户输入
- mongodb mongdb驱动
- node-zookeeper-client zookeeper驱动
- pm2 进程管理
- querystring 用于gateway解析参数
- redis redis驱动
- request 客户端请求gateway
- ws websocket聊天服务器底层网络支持

nodejs v10.16.0

npm 6.13.7

### 代码架构



![代码架构](http://assets.processon.com/chart_image/5e4fd490e4b069f82a0adea0.png)

* Server 服务器逻辑处理主模块，内容太多，不做详细说明。
* Protocol 协议模块，定义了客户端、集群、服务器的协议，并提供协议构造方法
* Core 框架核心支撑，net 网络发包，handler 指令分发器，interceptor 方法拦截器。具体可看测试用例



除Server模块外，Protocol和Core模块也是Client应用核心支撑模块。



#### handler 指令分发器



用于分发来自用户输入、客户端请求、服务器响应等指令消息（也可以成为协议）。

下面的代码是Server的客户端请求分发器

```javascript
const handlerMap = {
login: loginHandler,
chat: chatHandler,
leaderConnect: leaderConnectHandler,
syncServers: syncServerHandler,
userInfo: userInfoHandler,
joinRoom: joinRoomHandler,
popular: popularHandler,
};

const clientHandler = new Handler(handlerMap, defaultHandler);

clientConnection.on("message", function (message) {
const {action, data} = decodePackage(message);
const args = {
connection: clientConnection,
data: data,
};
clientHandler.getHandler().dispatch(action, args);
});
```



### 用户登录流程



![用户登录](http://assets.processon.com/chart_image/5e4fd972e4b0c037b5f8acc6.png)

用户从gateway拿到服务器地址连上服务器之后就会发送登录包。如果登录成功服务器会在本地进程中保存用户session信息，同时会往Redis登记登录信息。

#### 用户session

* 每个服务器会保存当前连接用户的session，以方便快速查询用户信息，服务器首先会查询本地session，然后再查全局session。用户下线服务器会删除本地session

* Redis同时会保存所有用户的session信息，以方便服务器快速查询用户在集群中是否在线。全局session保存用户登录时间戳、用户名、所在服务器ID。

* 用户下线会删除全局session。服务器停止不会更新全局session，因为当服务器因为断电等异常原因退出时并不能通知session失效。因此判断用户是否在线不光要从全局session中，还要判断session中登记的服务器信息是否在线。



### 消息路由

![消息路由](http://assets.processon.com/chart_image/5e4fdedae4b0cb56daa1b17f.png)

如上图，当follower收到消息时，会先后查询本地session和全局session以确定用户是否在线，以及是否连接在本服。如果不是就转发到Leader，Leader 因为连接了所有的follower，所以可以把消息转发到用户所在的服务器。



```javascript
const handleUserChat = (args) => {
const {connection, data} = args;
const {from = '', to = '', roomName = '', ts = 0, message = '', format = 'text'} = data;
session.findGlobal(to, (user) => {
const clusterInfo = cluster.getInfo();
if (!user || !user.isOnline) {
if (roomName.length === 0) {
sendMsg(protocol.newErrorResp(404, "user " + to + " is not on line"), connection);
}
return;
}
if (user.isLocal) {
const newMessage = dirtyWord.filter(message);
history.recordHst(data);
sendMsg(protocol.newChatResp({from, roomName, ts, message: newMessage, format}), user.connection);
return;
}
if (clusterInfo.isLeader) {
sendToNode(user.nodeId, protocol.newChatRQ({from, to, ts, roomName, message, format}));
} else {
//forward to leader
sendMsg(protocol.newChatRQ({from, to, roomName, ts, message, format}), cluster.getLeader().connection);
}
}
);
};
```



这里为了简单起见把监听客户请求的socket和监听服务器请求的socket都使用同一个socket。这样是不安全的，因为客户端很可能伪造发送不安全的指令到服务器。**因此，安全起见，需要把服务器间的socket从客户端连接中分离，并做内网隔离，只给客户端连接处理有限权限的指令。**

#### 聊天室



聊天室其实就是一个用户组，每条消息都会查询用户组所有成员然后广播。

和用户本地session分布在各自的follower不同，所有聊天室数据都会在leader启动的时候加载。因为聊天室里面的成员随时都在上线下线，且发送消息频率比单聊要多，不可能临时从数据库中查询成员列表，也无法像用户session那样跟随某个用户的上下线加载聊天室信息。同时，为了保证聊天室数据并发安全，所以一个聊天室只能加载在一个服务器中。因此，必须有一个单独的服务器来加载所有聊天室信息，为了简单起见，就暂时以leader服务器来承担聊天室服务的角色。**当然后续可以依赖zookeeper的调度来做聊天室集群,以方便横向扩展。**



世界聊天室、联盟聊天室等大组群聊天室不需要保存成员消息，只需要用户登录时根据自己的服务器信息和联盟信息加入到对于的聊天室中。



#### 最近聊天记录

依赖redis的列表，用户在获取最近聊天记录时指定范围就可以了。同时会清空超过50之前的老记录。

#### 热词排行榜

依靠redis的zset排序，主节点启动时会启动一个定时器，定时清空排行榜中的数据

### 如何扩展

#### 运维人员

只需要根据系统负载往集群中加机器就可以了。其他外部依赖除了redis外，其他zookeeper和mongodb也可以做集群。

#### 开发人员

- [ ] 添加事件回调，例如消息到达，消息发出、用户上线、用户下线、加入聊天室等业务事件，开发人员基于事件消息添加新业务逻辑。
- [ ] 聊天记录保存后可以通过RocketMQ\RabbitMQ\Kafka等消息队列投递到数据ES,Strom等数据中心，以便日后做数据分析。











