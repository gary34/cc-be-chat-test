"use strict";
/**
 *
 * @author pugang
 * @date 2020/2/19
 */

const {newBasePackage} = require('./base');


const newPopularRQ = ({n = 0}) => {
    return newBasePackage('popular', {n});
};

const newPopularResp = ({words = []}) => {
    return newBasePackage('popular', {words});
};


const newJoinRoomRQ = ({roomName, username, sourceNode}) => {
    return newBasePackage('joinRoom', {roomName, username, sourceNode});
};


// const newChatHstResp = () => {
//     return newBasePackage('joinRoom', {roomName, username});
// };

const newUserInfoRQ = ({username}) => {
    return newBasePackage('userInfo', {username});
};

const newUserInfoResp = ({username, loginTime, nodeId, isOnline}) => {
    return newBasePackage('userInfo', {username, loginTime, nodeId, isOnline});
};

const newChatRQ = ({from = '', to = '', roomName = '', ts = 0, isGroup = false, message = '', format = 'text'}) => {
    return newBasePackage('chat', {format, from, to, roomName, ts, isGroup, message});
};


const newChatResp = ({from = '', roomName = '', message = '', ts = 0, format = 'text'}) => {
    return newBasePackage('chat', {from, roomName, message, ts, format});
};

const newLoginRQ = (username, password) => {
    return newBasePackage('login', {username, password});
};


const newLoginResp = (userInfo = {}) => {
    return newBasePackage('login', userInfo);
};

const newErrorResp = (code, message = "", ext = "") => {
    return newBasePackage('error', {code, message, ext});
};


module.exports = {
    newBasePackage,
    newJoinRoomRQ,
    newChatRQ,
    newChatResp,
    newLoginRQ,
    newLoginResp,
    newErrorResp,
    newUserInfoRQ,
    newUserInfoResp,
    newPopularRQ,
    newPopularResp
};