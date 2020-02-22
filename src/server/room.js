"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/21
 */
const logger = require('../util/logger');
const mongo = require('./mongo');
const rooms = new Map();

const COLLECTION_NAME = 'rooms';
let dbClient;

function init(cb) {
    if (!cb) {
        cb = () => {
        };
    }
    dbClient = mongo.getDBClient();
    dbClient.collection(COLLECTION_NAME).find({}).toArray((err, docs) => {
        if (err) {
            throw err;
        }
        for (let doc of docs) {
            rooms.set(doc.roomName, doc);
        }
        logger.Info("load room finished load count:" + rooms.size);
        cb(null);
    });
}

function find(roomName) {
    return rooms.get(roomName);
}

function join(roomName, username, cb) {
    const room = find(roomName);
    if (!room) {
        logger.Warn("room not found:" + roomName);
        if (cb) {
            cb(new Error("room not found"));
        }
        return;
    }
    if (!room.members.find(m => m === username)) {
        room.members.push(username);
        dbClient.collection(COLLECTION_NAME).updateOne({_id: room._id}, {'$addToSet': {members: username}}, (error) => {
            if (cb) {
                cb(error);
                return;
            }
        });
    }
    logger.Warn("members:" + JSON.stringify(room.members));
}

function kick(roomName, username, cb) {
    const room = find(roomName);
    if (!room) {
        if (cb) {
            cb(new Error("room not found"));
        }
        return;
    }
    const index = room.members.findIndex(m => m === username);
    if (index >= 0) {
        room.members.splice(index, 1);
        dbClient.collection(COLLECTION_NAME).update({_id: room._id}, {'$pull': {members: username}}, (error) => {
            if (cb) {
                cb(error);
                return;
            }
        });

    }
}

module.exports = {
    init, find, join, kick
};