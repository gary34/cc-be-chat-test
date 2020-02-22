"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/21
 */
const test = require('ava');
const dirtyWord = require('./dirtyWord');
const util = require('util');
test.before(async () => {
    const init = util.promisify(dirtyWord.init);
    await init();
    console.log('done');
});

test('should filter bad word', t => {
    // dirtyWord.init(() => {
    const word = 'b00bs';
    var s = dirtyWord.filter(`ha${word}123`, '*');
    t.assert(s === 'ha*****123');
    s = dirtyWord.filter(`ha${word}`, '*');
    t.assert(s === 'ha*****');
    t.pass();
    // });
});

test.skip('dirty word benchmark', t => {
    // eslint-disable-next-line no-unused-vars
    // dirtyWord.init(() => {
    const logTime = (desc, cb) => {
        const startT = new Date().getTime();
        cb();
        const spendTime = (new Date().getTime()) - startT;
        console.log(desc + spendTime + "ms");
    };
    const count = 100 * 10000;
    let testWords = "dsah2dog-fucker3dsa,2313hjkdsaiejaculatinguhi3,231df u c ksa23";

    logTime("use tree spend:", () => {
        for (let i = 0; i < count; i++) {
            dirtyWord.filter(testWords);
        }
    });
    logTime("use index spend:", () => {
        for (let i = 0; i < count; i++) {
            dirtyWord.filterSimple(testWords);
        }
    });
    testWords = testWords + testWords;
    logTime("2 size use tree spend:", () => {
        for (let i = 0; i < count; i++) {
            dirtyWord.filter(testWords);
        }
    });
    logTime("2 size use index spend:", () => {
        for (let i = 0; i < count; i++) {
            dirtyWord.filterSimple(testWords);
        }
    });
    t.pass();
    // });
});