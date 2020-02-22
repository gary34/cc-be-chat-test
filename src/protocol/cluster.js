"use strict";
/**
 *
 * @author pugang
 * @date 2020/2/20
 */

const {newBasePackage} = require('./base');

const newLeaderAuthRQ = (nodeInfo) => {
    return newBasePackage('leaderConnect', nodeInfo);
};

const newSyncServerRQ = (servers = {}) => {
    return newBasePackage('syncServers', {servers})
};

module.exports = {

    newLeaderAuthRQ,
    newSyncServerRQ,
};