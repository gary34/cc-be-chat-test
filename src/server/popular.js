"use strict";

/**
 * 热词模块
 * @author pugang
 * @date 2020/2/22
 */
const {promisify} = require("util");
const logger = require('../util/logger');
const redis = require('./redis');
const PUNCTUATIONS = new Set([',', ':', '.', '?', '!', '@']);
const SPACE = ' ';
const REDIS_KEY = 'popular_words';
let intervalKey;

const config = require(process.cwd() + '/config/serverConfig');

/**
 * 只有在主节点才回调用init，否则多个工作节点都在重置排行榜
 */
function init() {
    intervalKey = setInterval(reset, config.popularTimeout * 1000);
}

/**
 * 查询排名靠前的热词
 * @param n 从上往下第几名
 * @returns {Promise<any>} 返回带分值的统计
 */
async function topN(n) {
    const redisClient = redis.getClient();
    const topnSync = promisify(redisClient.zrevrange).bind(redisClient);
    if (!n || n <= 0) {
        n = 1;
    }
    return await topnSync(REDIS_KEY, 0, n - 1, 'WITHSCORES');
}

function reset() {
    logger.Info("clean popular");
    redis.getClient().del(REDIS_KEY);
}

function stopReset() {
    if (intervalKey) {
        clearInterval(intervalKey);
    }
}

/**
 * 只要有消息发送就记录一次
 * @param sentence
 */
function record(sentence) {
    const words = spliceWords(sentence);
    let countMap = new Map();
    for (let word of words) {
        let c = 1;
        if (countMap.has(word)) {
            c = countMap.get(word) + 1;
        }
        countMap.set(word, c);
    }
    const redisClient = redis.getClient();
    countMap.forEach((c, word) => {
        // logger.Info("word:" + word + ",c:" + c);
        redisClient.zincrby(REDIS_KEY, c, word);
    });
}


function spliceWords(sentence) {
    for (let punctuation of PUNCTUATIONS) {
        sentence = sentence.replace(punctuation, SPACE);
    }
    return sentence.split(SPACE);
}

module.exports = {
    record, init, topN, stopReset,
};