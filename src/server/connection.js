"use strict";

/**
 * this file is connection manager.
 * TODO for security, it should split cluster admin socket from client socket
 * @author pugang
 * @date 2020/2/19
 */
const WebSocket = require('ws');
const {logger} = require('../util');
const config = require(process.cwd() + '/config/serverConfig');
const {decodePackage} = require('../protocol/encoder');

const clientHandler = require('./clientHandler');
const session = require('./session');

let clientSocketServer = null;

function init(cb) {
    if (clientSocketServer) {
        return cb(clientSocketServer);
    }
    clientSocketServer = new WebSocket.Server({port: config.clientPort});
    clientSocketServer.on('listening', () => {
            const address = clientSocketServer.address();
            logger.Info("server listen at:" + JSON.stringify(address));
            if (cb) {
                cb(clientSocketServer);
            }
        }
    );
    clientSocketServer.on('connection', handleNewConnection);
    return clientSocketServer;
}

function handleNewConnection(clientConnection) {
    logger.Info("rec a connection");
    clientConnection.on("message", function (message) {
        logger.Info("receive: " + message);
        const {action, data} = decodePackage(message);
        const args = {
            connection: clientConnection,
            data: data,
        };
        clientHandler.getHandler().dispatch(action, args);
    });
    clientConnection.on("close", () => {
        const username = clientConnection.username;
        logger.Info(username + " is offline");
        session.remove(username);
    });
}

function shutDown() {
    clientSocketServer.close();
}

module.exports = {
    init, shutDown,
};
