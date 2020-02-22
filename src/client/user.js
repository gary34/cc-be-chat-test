"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */


let userInfo = {};

function setInfo(info) {
    userInfo = Object.assign(userInfo, info);
}

function getInfo() {
    return userInfo;
}


module.exports = {
    setInfo,
    getInfo,
}