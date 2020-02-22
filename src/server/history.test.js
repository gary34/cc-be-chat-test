"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/22
 */

const test = require('ava');
const redis = require('./redis');
const util = require('util');
const mongo = require('./mongo');
const history = require('./history');

const testRoomName = 'hst_room';
const MongoCol = 'message_histories';
const RedisKey = 'room_hst_' + testRoomName;
test.before(async () => {
    const redisInit = util.promisify(redis.init);
    await redisInit();
    await redis.getClient().del(RedisKey);
    const mongoInit = util.promisify(mongo.init);
    await mongoInit();
    await mongo.getDBClient().collection(MongoCol).deleteMany({});
    console.log('before done');
});


test.serial("recordHistory", async t => {
    const message = {
        from: "hst_user",
        roomName: testRoomName,
        isGroup: true,
        ts: new Date().getTime(),
        message: "hello message"
    };
    history.recordHst(message);
    const doc = await mongo.getDBClient().collection(MongoCol).findOne({ts: message.ts});
    t.is(message.message, doc.message);
});


test.serial("get History", async t => {
    await redis.getClient().del(RedisKey);
    await mongo.getDBClient().collection(MongoCol).deleteMany({});

    const count = 100;
    for (let i = 1; i <= count; i++) {
        const message = {
            from: "hst_user",
            roomName: testRoomName,
            message: "message_" + i,
            ts: new Date().getTime(),
            isGroup: true,
        };
        history.recordHst(message);
    }
    const getLastHst = util.promisify(history.getLastHst);
    const hsts = await getLastHst(testRoomName, true);
    t.is(50, hsts.length);
    t.is("message_51", hsts[0].message);
    t.is("message_100", hsts[49].message);

});


