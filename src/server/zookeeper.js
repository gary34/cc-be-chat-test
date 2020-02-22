"use strict";

/**
 * zookeeper is use to select a leader ,watch followers and leader.
 * when a follower join , down the leader will notify all followers to update servers online state
 * when a leader down, zookeeper will notify all followers ,and followers will try to register leader
 * @author pugang
 * @date 2020/2/19
 */
const {logger} = require('../util');
const zookeeper = require('node-zookeeper-client');

const SERVER_PATH = '/chat/server';
const SERVER_LEADER = SERVER_PATH + '/leader';
const SERVER_FOLLOWER = SERVER_PATH + '/follower';

let myNode = {
    path: '',
    host: '',
    port: '',
    isLeader: false,
    leader: {},
    followers: [],
};


let zkClient;

let defaultCallback = (e, data) => {
    // logger.Info(e.stack);
    if (e) {
        throw  e;
    }
    logger.Info(JSON.stringify(data));

};

function watchLeader() {
    zkClient.getData(SERVER_LEADER, (event) => {
        if (event.type === zookeeper.Event.NODE_DELETED) {
            registerLeader(zkClient, SERVER_LEADER);
        } else if (!myNode.isLeader) {
            watchLeader(zkClient, SERVER_LEADER);
        }
    }, (error, data, stat) => {
        if (error && error.code !== zookeeper.Exception.NO_NODE) {
            defaultCallback(error);
            return;
        }
        if (stat) {
            myNode.leader = JSON.parse(data.toString());
        } else {
            registerLeader();
        }
    });
}

function registerFollower() {
    if (myNode.isLeader) {
        return;
    }
    removeNodeAsync();
    let nodeName = myNode.host + ":" + myNode.port;
    zkClient.create(SERVER_FOLLOWER + "/" + nodeName, null, zookeeper.CreateMode.EPHEMERAL, (error, path) => {
        if (error) {
            defaultCallback(error);
            return;
        }
        logger.Info("register as follower path is :" + path);
        myNode.path = path;
        myNode.isLeader = false;
        watchLeader();
    });
}

function watchFollower() {
    logger.Info("watchFollower....");
    zkClient.getChildren(SERVER_FOLLOWER, (event) => {
        // logger.Info(event);
        if (event && event.type === zookeeper.Event.NODE_CHILDREN_CHANGED) {
            updateFollower();
            // watchFollower();
        }
    }, (error, children) => {
        if (error) {
            defaultCallback(error);
        }
        doUpdateFollower(children);

    });
}

function doUpdateFollower(children) {
    myNode.followers = children.map(nodeName => {
        let [host, port] = nodeName.split(":");
        return {
            host, port
        };
    });
    defaultCallback(null, myNode);
}

function updateFollower() {
    zkClient.getChildren(SERVER_FOLLOWER, (error, children) => {
        if (error) {
            defaultCallback(error);
            return;
        }
        doUpdateFollower(children);
        watchFollower();
    });
}

function removeNodeAsync() {
    if (myNode.path.length === 0) {
        return;
    }
    zkClient.remove(myNode.path, (error) => {
        if (error) {
            logger.Notice(error.stack)
        }
        logger.Info('remove node:' + myNode.path);
    });
}

function registerLeader() {
    const nodeData = JSON.stringify({
        host: myNode.host,
        port: myNode.port
    });
    zkClient.create(SERVER_LEADER, Buffer.from(nodeData), zookeeper.ACL.OPEN_ACL_UNSAFE, zookeeper.CreateMode.EPHEMERAL, (err) => {
            if (err) {
                //&& err.code !== zookeeper.Exception.NODE_EXISTS
                if (err.code !== zookeeper.Exception.NODE_EXISTS) {
                    defaultCallback(err);
                    return;
                }
                registerFollower();
                return;
            }
            logger.Info("register as leader");
            if (!myNode.isLeader) {
                removeNodeAsync();
            }
            myNode.isLeader = true;
            watchFollower();
            defaultCallback(null, myNode);
        }
    )
}


function start(zkHost, host, port, cb) {
    if (zkClient) {
        throw new Error("zookeeper client had initialized");
    }
    zkClient = new zookeeper.createClient(zkHost, {sessionTimeout: 100});
    myNode.host = host;
    myNode.port = port;
    if (cb) {
        defaultCallback = cb;
    }
    zkClient.once('connected', () => {
        logger.Info("zookeeper connected:" + zkHost);
        zkClient.mkdirp(SERVER_FOLLOWER, (e) => {
            if (e) {
                if (e.code === zookeeper.Exception.NODE_EXISTS) {
                    defaultCallback(e);
                    return;
                }
                throw e;
            }
            // watchLeader();
            registerLeader();
        });
    });
    zkClient.connect();
}

function nodeInfo() {
    return myNode;
}

// start("localhost:2181", "host", port);
module.exports = {start, nodeInfo};

