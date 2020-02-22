const serverConfig = {
    zkHost: 'localhost:2181',
    //内部集群访问的主机地址
    rpcHost: '127.0.0.1',
    //使用动态端口
    rpcPort: 0,
    //客户端访问的端口
    clientHost: '127.0.0.1',
    //使用动态端口，为了开发方便
    clientPort: 0,
    redisUrl: 'redis://localhost:6379/1',
    mongoUrl: 'mongodb://localhost:27017/',
    mongoDBName: 'chat',
    //排行榜刷新时间
    popularTimeout: 3600,
};

module.exports = serverConfig;