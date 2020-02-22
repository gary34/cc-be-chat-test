"use strict";
/**
 *
 * @author pugang
 * @date 2020/2/19
 */
const WebSocket = require('ws');
const logger = require('../util/logger');
const {decodePackage} = require('../protocol/encoder');
const config = require(process.cwd() + '/config/clientConfig');
const request = require('request');
const respHandler = require('./respHandler');


let netConnection = null;

function getConnection() {
    return netConnection;
}

function init(cb) {
    connectServer(cb);
}


function connectServer(cb) {
    const get_server_api = config.gatewayUrl + '/server';
    logger.Info("gateway url:" + get_server_api);
    request(get_server_api, function (error, response, body) {
        if (error) {
            throw  error;
        }
        if (response && response.statusCode != 200) {
            throw new Error("gateway error :" + response.statusCode);
        }
        const serverInfo = JSON.parse(body);
        const serverUrl = "ws://" + serverInfo.host + ":" + serverInfo.port;
        doConnectServer(serverUrl, cb);
    });
}


function doConnectServer(serverUrl, cb) {
    logger.Info("begin connect to server:" + serverUrl);
    netConnection = new WebSocket(serverUrl);
    netConnection.on('open', () => {
        logger.Info("connect server success");
        cb(null, netConnection);
    });

    netConnection.on('close', (code, reason) => {
        logger.Info("connection close:" + reason);
        process.exit(0);
    });

    netConnection.on('unexpected-response', () => {
        logger.Info("connection unexpected-response:");
        process.exit(0);
    });

    netConnection.on('error', (err) => {
        logger.Info("connection error:" + err);
        process.exit(0);
    });

    netConnection.on('message', (message) => {
        const {action, data} = decodePackage(message);
        const args = {
            connection: netConnection,
            data: data,
        };
        // logger.Info('receive message:' + message);
        respHandler.getHandler().dispatch(action, args);
    });
}

module.exports = {init, getConnection};