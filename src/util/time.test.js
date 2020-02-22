"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/21
 */
const test = require('ava');
const time = require('./time');

test('formatDuring', t => {
    const d = time.formatDuring(3 * time.DAY + 1 * time.SECOND);
    t.assert(d === '3d 1s');
});