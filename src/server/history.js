"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */

const redis = require('./redis');
const mongo = require('./mongo');
const logger = require('../util/logger');
const popular = require('./popular');
const COLLECTION_NAME = 'message_histories';
const KEEP_HST = 50;

function recordHst(chatMessage) {
    mongo.getDBClient().collection(COLLECTION_NAME).insertOne(chatMessage);
    let key;
    if (chatMessage.isGroup) {
        key = 'room_hst_' + chatMessage.roomName;
    } else {
        key = 'hst_' + chatMessage.to;
    }
    redis.getClient().lpush(key, JSON.stringify(chatMessage));
    popular.record(chatMessage.message);

}

function getLastHst(to, isGroup, cb) {
    let key;
    if (isGroup) {
        key = 'room_hst_' + to;
    } else {
        key = 'hst_' + to;
    }
    redis.getClient().multi().ltrim(key, 0, KEEP_HST - 1).lrange(key, 0, KEEP_HST - 1).exec((error, results) => {
        if (error) {
            logger.Warn(error.stack);
            cb(error, null);
            return;
        }
        const hsts = results[1].map(str => JSON.parse(str)).reverse();
        cb(null, hsts);
    });
}

module.exports = {
    recordHst, getLastHst
};