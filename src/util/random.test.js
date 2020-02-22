"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/21
 */

const test = require('ava');
const random = require('./random');

test('random.randInt', t => {
    const max = 100;
    for (let i = 0; i < 100; i++) {
        const i = random.randInt(max);
        t.assert(0 <= i && i < 100);
    }
});