"use strict";

/**
 * handler user input
 * @author pugang
 * @date 2020/2/19
 */
const Handler = require("../core/handler");
const protocol = require('../protocol/client');
const {sendMsg} = require('../core/net');
const user = require('./user');
const {ask, logger} = require('../util');

// const connection = require('./connection');
const SPACE = ' ';

function init() {
    printHelper();
    loopInput();
}

let askLogin = () => {
    ask("Entry your name", (username) => {
        user.setInfo({username});

        const connection = require('./connection');
        sendMsg(protocol.newLoginRQ(username), connection.getConnection());
    });
};

function inputParse(clientInputStr) {
    if (clientInputStr.length == 0 || clientInputStr == '/' || clientInputStr.charAt(0) != '/') {
        return {}
    }
    let words = clientInputStr.slice(1).split(SPACE);
    let action = words[0];
    let data = words.slice(1);
    return {action, data};
}


function loopInput() {
    ask('>', (inputStr) => {
        inputStr = inputStr.trim();
        let msg = inputParse(inputStr);
        if (msg.action == undefined) {
            printHelper();
            loopInput();
            return;
        }
        inputHandler.dispatch(msg.action, msg.data);
        loopInput();
    });
}

function chatHandler(data) {
    if (data.length < 2) {
        logger.Warn("invalid chat input expect: /chat to user message");
        return;
    }
    const to = data[0];
    const args = {
        from: user.getInfo().username,
        to: to,
        message: data.slice(1).join(' '),
        ts: new Date().getTime(),
    };
    if (to.indexOf('room:') === 0) {
        const roomName = to.slice('room:'.length);
        args.roomName = roomName;
        args.to = null;
        args.isGroup = true;
    }

    let chatPackage = protocol.newChatRQ(args);
    const connection = require('./connection');
    sendMsg(chatPackage, connection.getConnection());
}


function userStatsHandler(data) {
    if (data.length == 0 || data[0].length === 0) {
        logger.Warn("please input username");
        return;
    }
    const args = {
        username: data[0],
    };
    let rqPackage = protocol.newUserInfoRQ(args);
    const connection = require('./connection');
    sendMsg(rqPackage, connection.getConnection());
}

function joinRoomHandler(data) {
    if (data.length == 0 || data[0].length === 0) {
        logger.Warn("please input room name");
        return;
    }
    const args = {
        roomName: data[0],
        username: user.getInfo().username,
    };
    let rqPackage = protocol.newJoinRoomRQ(args);
    const connection = require('./connection');
    sendMsg(rqPackage, connection.getConnection());
}

function popularHandler([n]) {
    if (!n) {
        n = 0;
    }
    let rqPackage = protocol.newPopularRQ({n});
    const connection = require('./connection');
    sendMsg(rqPackage, connection.getConnection());
}

function printHelper() {
    console.log("/[action] args:");
    console.log("/chat ${toUserName}[room:${roomName}] ${any words}");
    console.log("/stats ${username}");
    console.log('/popular [${n}]');
    console.log("/joinRoom ${roomName}");
    console.log("/whoami ");
    console.log("/exit");

}

let messageHandlerMap = {
    exit: () => {
        process.exit(0);
    },
    whoami: () => {
        console.log(JSON.stringify(user.getInfo()));
    },
    chat: chatHandler,
    help: printHelper,
    stats: userStatsHandler,
    joinRoom: joinRoomHandler,
    popular: popularHandler,
    '?': printHelper,
};

const inputHandler = new Handler(messageHandlerMap, printHelper);


function getHandler() {
    return inputHandler;
}

module.exports = {getHandler, askLogin, init, printHelper};