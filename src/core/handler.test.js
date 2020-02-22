"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/21
 */

const test = require('ava');
const Handler = require('./handler');

test("should dispatch handler", t => {
    const handlerMap = {
        "action1": () => {
            return 'value1';
        },
        "action2": (message) => {
            return message
        },
    };
    const messageHandler = new Handler(handlerMap);
    const ret1 = messageHandler.dispatch("action1");
    t.is('value1', ret1);
    const ret2 = messageHandler.dispatch("action2", "mess");
    t.is('mess', ret2);
});

test("should dispatch handler with default", t => {
    const handlerMap = {};
    const messageHandler = new Handler(handlerMap, () => {
        return "defaultValue";
    });
    const ret1 = messageHandler.dispatch("any actions");
    t.is('defaultValue', ret1);
});
