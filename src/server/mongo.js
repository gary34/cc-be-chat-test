"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */

const logger = require('../util/logger');
const config = require(process.cwd() + '/config/serverConfig');
const MongoClient = require('mongodb').MongoClient;

let dbClient = null;
let mongoClient = null;

function getDBClient() {
    return dbClient;
}

function getMongoClient() {
    return mongoClient;
}

function init(cb) {
    MongoClient.connect(config.mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err, client) {
        if (err) throw cb(err);
        logger.Info("connect mongo success");
        mongoClient = client;
        dbClient = mongoClient.db(config.mongoDBName);
        if (cb) {
            cb(null, mongoClient, dbClient);
        }
    });
}

module.exports = {
    init, getDBClient, getMongoClient,
};
