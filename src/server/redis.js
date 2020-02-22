"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */
const config = require(process.cwd() + '/config/serverConfig');
const {logger} = require('../util');
const redis = require("redis");

let client = null;

function init(cb) {
    if (!cb) {
        cb = () => {
        };
    }
    if (client != null) {
        return cb(null, client);
    }
    client = redis.createClient(config.redisUrl);
    client.once('ready', function () {
        logger.Info("redis ready!");
        cb(null, client);
    });
    client.on('error', function (error) {
        logger.Error(error.stack);
    });
    return client;
}

function getClient() {
    return client;
}

module.exports = {
    getClient, init
};