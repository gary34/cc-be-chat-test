"use strict";
/**
 * handler server response
 * @author pugang
 * @date 2020/2/19
 */

const Handler = require("../core/handler");
const inputHandler = require('./inputHandler');
const user = require('./user');
const logger = require('../util/logger');
const {formatDuring, timeAgo} = require('../util/time');
let loginRespHandler = function ({data: {sessionId}}) {
    user.setInfo({sessionId});
    logger.Info("login success sessionId:" + sessionId);
    inputHandler.init();
};

let chatRespHandler = function ({data: {from, roomName, ts, message}}) {
    if (roomName.length > 0) {
        logger.Notice(timeAgo(ts) + " " + from + '@' + roomName + " say:" + message);
    } else {
        logger.Notice(timeAgo(ts) + " " + from + " say:" + message);
    }
};

let userInfoRespHandler = function ({data: {username, loginTime, nodeId}}) {
    const onlineTimeDesc = formatDuring(new Date().getTime() - loginTime);
    logger.Notice(`${username} ${onlineTimeDesc} at server: ${nodeId}`);
};

let errorRespHandler = function ({data: {code, message}}) {
    switch (code) {
        case 401:
            logger.Info(message);
            inputHandler.askLogin();
            break;
        default:
            logger.Notice(message);
    }
};

let popularRespHandler = ({data: {words = []}}) => {
    const n = words.length / 2;
    for (let i = 0; i < n; i++) {
        const word = words[i * 2];
        const c = words[i * 2 + 1];
        logger.Info(`word: ${word}, count: ${c}`);
    }
};
const respHandlerMap = {
    login: loginRespHandler,
    chat: chatRespHandler,
    error: errorRespHandler,
    userInfo: userInfoRespHandler,
    popular: popularRespHandler,
};

let respHandler = new Handler(respHandlerMap);

function getHandler() {
    return respHandler;
}

module.exports = {
    getHandler
};