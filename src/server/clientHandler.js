"use strict";

/**
 * the file is handler for client request
 * @author pugang
 * @date 2020/2/19
 */
const Handler = require("../core/handler");
const userManager = require('./user');
const protocol = require('../protocol/client');
const {sendMsg} = require('../core/net');
const session = require('./session');
const cluster = require('./cluster');
const logger = require('../util/logger');
const dirtyWord = require('./dirtyWord');
const room = require('./room');
const history = require('./history');
const popular = require('./popular');


const sendToNode = (nodeId, data, cb) => {
    const node = cluster.findServer(nodeId);
    if (node) {
        sendMsg(data, node.connection, cb);
    } else {
        if (cb) {
            cb(new Error("user is offline"));
        }
    }
};

const sendToLeader = (data, cb) => {
    sendMsg(data, cluster.getLeader().connection, cb);
};

const sendToUser = (data, {connection}, cb) => {
    sendMsg(data, connection, cb)
};


const loginHandler = async ({connection, data: {username, password}}) => {
    const loginRet = await userManager.checkPass(username, password);
    if (!loginRet) {
        sendToUser(protocol.newErrorResp(401, "user " + username + " is invalided"), {connection});
        return;
    }
    const sessionId = session.set(username, {
        username,
        connection,
    });
    connection.username = username;
    sendToUser(protocol.newLoginResp({username, sessionId}), {connection});
};


const chatHandler = (args) => {
    const {data: {isGroup = false}} = args;
    if (isGroup) {
        handleRoomChat(args);
    } else {
        handleUserChat(args);
    }
};

const handleRoomChat = (args) => {
    const {connection, data} = args;
    const {from = '', roomName = '', message = '', ts = 0, format = 'text'} = data;
    const clusterInfo = cluster.getInfo();
    if (clusterInfo.isLeader) {
        const r = room.find(roomName);
        if (!r) {
            //drop message
            //todo notify user
            return;
        }
        history.recordHst(data);
        for (let member of r.members) {
            const memberMsg = {from, to: member, roomName, ts, message, format};
            handleUserChat({connection, data: memberMsg});
        }
    } else {
        //forward to leader
        logger.Info("forward to leader");
        sendToLeader(protocol.newChatRQ(data));
    }
};

const handleUserChat = (args) => {
    const {connection, data} = args;
    const {from = '', to = '', roomName = '', ts = 0, message = '', format = 'text'} = data;
    session.findGlobal(to, (user) => {
            const clusterInfo = cluster.getInfo();
            if (!user || !user.isOnline) {
                if (roomName.length === 0) {
                    sendToUser(protocol.newErrorResp(404, "user " + to + " is not on line"), {connection});
                }
                return;
            }
            if (user.isLocal) {
                const newMessage = dirtyWord.filter(message);
                history.recordHst(data);
                sendToUser(protocol.newChatResp({from, roomName, ts, message: newMessage, format}), user);
                return;
            }
            if (clusterInfo.isLeader) {
                sendToNode(user.nodeId, protocol.newChatRQ({from, to, ts, roomName, message, format}));
            } else {
                //forward to leader
                sendToLeader(protocol.newChatRQ({from, to, roomName, ts, message, format}));
            }
        }
    );
};

const userInfoHandler = ({connection, data: {username}}) => {
    session.findGlobal(username, (user) => {
        if (!user || !user.isOnline) {
            sendToUser(protocol.newErrorResp(404, "user " + username + " is not on line"), {connection});
            return;
        }

        const resp = {
            username, loginTime: user.loginTime, nodeId: user.nodeId,
        };
        // sendMsg(protocol.newUserInfoResp(resp), connection);
        sendToUser(protocol.newUserInfoResp(resp), {connection});
    })
};

const joinRoomHandler = ({connection, data: {roomName, username, sourceNode}}) => {
    const history = require('./history');
    if (!sourceNode) {
        history.getLastHst(roomName, true, (err, hsts) => {
            for (let {from, message, ts, format} of hsts) {
                const hstMsg = {from, roomName, ts, message, format};
                sendToUser(protocol.newChatResp(hstMsg), {connection});
            }
        });
    }
    if (cluster.getInfo().isLeader) {
        room.join(roomName, username);
    } else {
        //TODO to return join result
        sendToLeader(protocol.newJoinRoomRQ({roomName, username, sourceNode: cluster.getInfo().nodeId}));
    }
};

const popularHandler = async ({connection, data: {n}}) => {
    const words = await popular.topN(n);
    // sendMsg(protocol.newPopularResp({words}), connection);
    sendToUser(protocol.newPopularResp({words}), {connection});
};
///////////////////////////////// for cluster

//// receive a leader connect
const leaderConnectHandler = ({connection, data}) => {
    data.connection = connection;
    cluster.setLeader(data);
};

const syncServerHandler = ({data: {servers}}) => {
    cluster.setServers(servers);
};

let defaultHandler = (action, args) => {
    logger.Error("unknown action:" + action + ",args:" + JSON.stringify(args.data));
    // sendMsg(protocol.newErrorResp(501, "unknown action:" + action), connection);
};


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

function getHandler() {
    return clientHandler;
}

module.exports = {getHandler};