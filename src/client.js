"use strict";

/**
 * @author pugang
 * @date 2020/2/19
 */
const connection = require('./client/connection');
const inputHandler = require('./client/inputHandler');

function start() {
    process.on('SIGINT', () => {
        process.exit(0);
    });

    process.on("exit", () => {
        console.log("exiting...");
    });

    connection.init(inputHandler.askLogin);
}

start();