"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/21
 */

const test = require('ava');
const mongo = require('./mongo');
const roomManager = require('./room');
const util = require('util');
test.before(async () => {
    const initMongo = util.promisify(mongo.init);
    const initRoom = util.promisify(roomManager.init);
    await initMongo();
    await initRoom();
});

test.serial('find room', t => {
    const roomName = 'room1';
    let room = roomManager.find(roomName);
    t.assert(room.roomName === roomName);
});


test.serial('join room', t => {
    const roomName = 'room1';
    const username = 'test_username_123';
    roomManager.join(roomName, username);
    const room = roomManager.find(roomName);
    const u = room.members.find(m => m === username);
    t.assert(u === username);
});


test.serial('kick user', t => {
    const roomName = 'room1';
    const username = 'test_username_123';
    roomManager.kick(roomName, username);
    const room = roomManager.find(roomName);
    const u = room.members.find(m => m === username);
    t.assert(u === undefined);
});