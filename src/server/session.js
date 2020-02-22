"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/20
 */
const {randInt} = require('../util/random');
const redis = require('./redis');
const cluster = require('./cluster');
const logger = require('../util/logger');


let sessions = new Map();

function set(username, data) {
    const now = new Date();
    const loginTime = now.getTime();
    data.sessionId = randInt(1000 * 10000);
    data.loginTime = loginTime;
    // data.isOnline = true;
    sessions.set(username, data);
    setGlobal(username, data);
    return data.sessionId;
}

const GLOBAL_SESSION_KEY = 'global_sessions';

function setGlobal(username, data) {
    const nodeInfo = cluster.getInfo();
    const sessionData = {
        nodeId: nodeInfo.nodeId,
        loginTime: data.loginTime,
    };
    redis.getClient().hset(GLOBAL_SESSION_KEY, username, JSON.stringify(sessionData));
}

function findGlobal(username, cb) {
    let localUser = findLocal(username);
    if (localUser) {
        cb(localUser);
        return;
    }
    redis.getClient().hget(GLOBAL_SESSION_KEY, username, (err, str) => {
        if (err) {
            logger.Error(err.stack);
            return;
        }
        if (str && str.length > 0) {
            const sessionData = JSON.parse(str);
            const servers = cluster.getServers();
            const isOnline = Object.prototype.hasOwnProperty.call(servers, sessionData.nodeId);
            sessionData.isOnline = isOnline;
            sessionData.isLocal = false;
            cb(sessionData);
        } else {
            cb(null);
        }
    });
}

function remove(username, data) {
    sessions.get(username, data);
    removeGlobal(username);
}

function removeGlobal(username, cb) {
    redis.getClient().hdel(GLOBAL_SESSION_KEY, username, (err) => {
        if (cb) {
            cb(err);
        }
    });
}

function findLocal(key) {
    let data = sessions.get(key);
    if (data) {
        const nodeInfo = cluster.getInfo();
        data.isOnline = true;
        data.isLocal = true;
        data.nodeId = nodeInfo.nodeId;
    }
    return data;

}

module.exports = {
    set, remove, findLocal,
    setGlobal, findGlobal
};