"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */
const interceptor = require('./interceptor');

/**
 * for dispatch actions
 *
 */
class Handler {
    constructor(handlerMap = {}, defaultHandler, interceptors = [],) {
        this._handlerMap = handlerMap;
        //todo before ,after ,around hooks
        this._interceptorChain = interceptor(interceptors);
        this._defaultHandler = defaultHandler;
    }

    dispatch(action, args) {
        let fn = this._handlerMap[action];
        if (fn) {
            return this._interceptorChain.go(args, fn);
        } else {
            if (this._defaultHandler) {
                return this._defaultHandler(action, args);
            }
        }
    }
}

module.exports = Handler;