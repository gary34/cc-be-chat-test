"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/21
 */

const test = require('ava');
const interceptor = require('./interceptor');

function parseArgFun(msg, next) {
    console.log("call parseArgFun args: " + msg);
    //parse args
    const ret = next(JSON.parse(msg));
    return ret;
}

function modifyArgFun({action}, next) {
    console.log("call modifyArgFun args: " + action);
    //modify args
    action = action + ":modify2";
    const ret = next({action});
    return ret;
}


function modifyRetFun(args, next) {
    //modify args
    let ret = next(args);
    ret = ret + ":modify3";
    return ret;
}

function throwErrorFun() {
    throw new Error("make error");
}


test("interceptor can modify args", t => {
    const source_action = 'test_action';
    const source_args = JSON.stringify({action: source_action});
    const handler = ({action}) => {
        console.log("action handle args: " + action);
        t.is(action, source_action + ':modify2');
        return "handler_ret:" + action;
    };
    const funChain = [parseArgFun, modifyArgFun];
    const handlerChain = interceptor(funChain);
    handlerChain.go(source_args, handler);
    t.pass();
});


test("interceptor can modify return", t => {
    const handler = () => {
        return "handler_ret";
    };
    const funChain = [modifyRetFun];
    const handlerChain = interceptor(funChain);
    const ret = handlerChain.go(null, handler);
    t.is(ret, 'handler_ret:modify3');
    t.pass();
});


test("interceptor can throw error", t => {
    const handler = () => {
        t.fail("show not be run");
        return "handler_ret";
    };
    const funChain = [throwErrorFun];
    const handlerChain = interceptor(funChain);
    t.throws(() => handlerChain.go(null, handler));
    t.pass();
});
