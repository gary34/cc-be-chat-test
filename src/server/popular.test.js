"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/22
 */

const test = require('ava');
const redis = require('./redis');
const util = require('util');
const popular = require('./popular');

test.before(async () => {
    const redisInit = util.promisify(redis.init);
    await redisInit();
    await redis.getClient().del('popular_words');
    console.log('before done');
});

test('get top N', async t => {
    popular.record("one two three");
    popular.record("one two");
    popular.record("one");
    let tops = await popular.topN(3);
    t.is(6, tops.length);
    t.is('one', tops[0]);
    t.is('3', tops[1]);
    t.is('two', tops[2]);
    t.is('2', tops[3]);
    t.is('three', tops[4]);
    t.is('1', tops[5]);
});

