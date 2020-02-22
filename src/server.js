"use strict";

/**
 * @author pugang
 * @date 2020/2/19
 */
const redis = require('./server/redis');
const connection = require('./server/connection');
const cluster = require('./server/cluster');
const dirtyWord = require('./server/dirtyWord');
const mongo = require('./server/mongo');
const util = require('util');

async function start() {
    process.on('SIGINT', () => {
        process.exit(0);
    });
    process.on("exit", () => {
        console.log("exiting...");
        connection.shutDown();
    });
    await util.promisify(mongo.init)();
    await util.promisify(redis.init)();
    dirtyWord.init();
    connection.init((clientSocketServer) => {
        cluster.init(clientSocketServer.address().port)
    });
}

start();

