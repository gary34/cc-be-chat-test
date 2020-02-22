"use strict";

/**
 * to make test data
 * @author pugang
 * @date 2020/2/19
 */

const redis = require('./server/redis');
const mongo = require('./server/mongo');
const logger = require('./util/logger');

function makeTestUsers() {
    let users = [];
    for (let i = 1; i < 100; i++) {
        users.push({
            username: 'user' + i,
        });
    }
    return users;
}

function makeRooms() {
    let rooms = [];
    for (let i = 1; i < 10; i++) {
        let members = [];
        for (let j = 1; j < 10; j++) {
            //members.push("user" + ((i - 1) * 10 + j));
        }
        rooms.push({
            roomName: 'room' + i,
            members,
        });
    }
    return rooms;
}

function seed() {
    redis.init((error, client) => {
        client.flushdb();
        logger.Notice("redis flushdb!");
        client.quit();
    });
    mongo.init(async (err, mongoClient, dbClient) => {
        await dbClient.collection('users').deleteMany({});
        logger.Notice("clean users");
        await dbClient.collection('users').insertMany(makeTestUsers());
        logger.Notice("add test users user1-100");
        await dbClient.collection('rooms').deleteMany({});
        logger.Notice("clean rooms");
        await dbClient.collection('rooms').insertMany(makeRooms());
        logger.Notice("add test rooms room1-100");
        await dbClient.collection('message_histories').deleteMany({});
        logger.Notice("clean message_histories");

        logger.Notice("reset mongo data finish!");

        mongoClient.close();
    });
}

seed();