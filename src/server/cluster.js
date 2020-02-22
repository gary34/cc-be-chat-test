"use strict";

/**
 * the file is cluster manager
 * @author pugang
 * @date 2020/2/19
 */
const WebSocket = require('ws');
const {logger} = require('../util');
const config = require(process.cwd() + '/config/serverConfig');
const redis = require('./redis');
const zookeeper = require('./zookeeper');
const {decodePackage} = require('../protocol/encoder');
const room = require('./room');
const {sendMsg} = require('../core/net');
const protocol = require('../protocol/cluster');
const popular = require('./popular');

let clusterInfo = {};
let followers = new Map();
let leader = null;
let servers = new Map();

function nodeId({host, port}) {
    return `${host}:${port}`;
}

function getServers() {
    return servers;
}

function setServers(newServers) {
    servers = newServers;
}

function setLeader(info) {
    leader = {...info};
}

function getLeader() {
    return leader;
}

function init(listenPort) {
    clusterInfo.host = config.clientHost;
    clusterInfo.port = listenPort;
    clusterInfo.nodeId = nodeId(clusterInfo);
    zookeeper.start(config.zkHost, config.clientHost, listenPort, (error, data) => {
        if (error) {
            throw error;
        }
        clusterInfo = {...data};
        clusterInfo.host = config.clientHost;
        clusterInfo.port = listenPort;
        clusterInfo.nodeId = nodeId(clusterInfo);
        if (data.isLeader) {
            let newServerList = [...data.followers];
            newServerList.push({host: data.host, port: data.port, isLeader: true});
            redis.getClient().set('server_list', JSON.stringify(newServerList));
            let newServers = {};
            for (let s of newServerList) {
                s.nodeId = nodeId(s);
                newServers[s.nodeId] = s;
            }
            setServers(newServers);
            connectFollowers(data.followers);
            checkRemovedFollower(data.followers);
            room.init();
            popular.init();
        } else {
            popular.stopReset();
        }
    });
}


function connectFollowers(followers) {
    for (let follower of followers) {
        doConnectFollower(follower);
    }
}

function checkRemovedFollower(newFollowers) {
    let newNodes = new Set();
    for (let f of newFollowers) {
        newNodes.add(nodeId(f));
    }
    for (let nodeId of followers.keys()) {
        if (!newNodes.has(nodeId)) {
            logger.Info("will close :" + nodeId);
            const {connection} = followers.get(nodeId);
            connection.terminate();
            cleanFollower(nodeId);
        }
    }
}

function cleanFollower(nodeId) {
    followers.delete(nodeId);
}

function sendSyncServers(connection) {
    sendMsg(protocol.newSyncServerRQ(servers), connection);
}

function doConnectFollower(server) {
    const serverId = nodeId(server);
    if (followers.has(serverId)) {
        const connection = followers.get(serverId).connection;
        if (connection && connection.readyState === WebSocket.OPEN) {
            sendSyncServers(connection);
        }
        return;
    }
    logger.Info("begin connect to follower server:" + serverId);
    const serverAddr = `ws://${server.host}:${server.port}`;
    const connection = new WebSocket(serverAddr);
    followers.set(serverId, {connection, nodeInfo: server, nodeId: serverId});
    connection.on('open', () => {
        logger.Info("connect follower server success:" + serverAddr);
        connection.id = serverId;
        sendMsg(protocol.newLeaderAuthRQ({
            host: clusterInfo.host,
            port: clusterInfo.port,
            nodeId: clusterInfo.nodeId,
        }), connection);
        sendSyncServers(connection);

    });

    connection.on('close', (code, reason) => {
        logger.Info("connection close:" + reason);
        cleanFollower(connection.id);
    });

    connection.on('unexpected-response', () => {
        logger.Info("connection unexpected-response:");
        cleanFollower(connection.id);
    });

    connection.on('error', (err) => {
        logger.Info("connection error:" + err);
        cleanFollower(connection.id);
    });
    // for modules_cycles imports
    const clientHandler = require('./clientHandler');
    connection.on("message", function (message) {
        logger.Info("receive: " + message);
        const {action, data} = decodePackage(message);
        const args = {
            connection: connection,
            data: data,
        };

        clientHandler.getHandler().dispatch(action, args);
    });
}

function findServer(server) {
    return followers.get(server);
}

function getInfo() {
    return clusterInfo;
}

module.exports = {
    findServer, init, getInfo, setLeader, getLeader,
    setServers, getServers,
};
