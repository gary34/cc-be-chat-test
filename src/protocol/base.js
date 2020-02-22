"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */
const {randInt} = require('../util/random');

const newBasePackage = (action, data) => {
    let now = new Date();
    let id = now.getTime() * 1000 + randInt(1000);
    return {id, action, data};
};

module.exports = {newBasePackage}