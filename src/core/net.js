"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */
const {encodePackage} = require('../protocol/encoder');

const sendMsg = (data, connection, cb) => {
    const packageData = encodePackage(data);
    connection.send(packageData, {}, cb);
};

module.exports = {
    sendMsg
};