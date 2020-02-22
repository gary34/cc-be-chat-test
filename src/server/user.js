"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */

// let users = new Set(['test1', 'test2', 'test3', 'test4', 'test5', 'test6']);
const mongo = require('./mongo');

const COLLECTION_NAME = 'users';

async function checkPass(username, password) {
    const collection = mongo.getDBClient().collection(COLLECTION_NAME);
    const user = await collection.findOne({username});
    if (user) {
        return true;
    }
    return false;
}

module.exports = {checkPass};