"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/20
 */


class Interceptor {
    constructor(beforeInterceptor, fn) {
        this._beforeInterceptor = beforeInterceptor;
        this._fn = fn;
        if (!fn) {
            this._fn = (args, next) => {
                return next(args)
            };
        }

    }

    go(args, targetFn) {
        let next = (a) => {
            if (this._beforeInterceptor) {
                return this._beforeInterceptor.go(a, targetFn);
            } else {
                return targetFn(a);
            }
        };
        return this._fn(args, next);
    }
}

function buildInterceptorChain(interceptors = []) {
    let interceptor = new Interceptor(null, null);
    for (let i of interceptors.reverse()) {
        interceptor = new Interceptor(interceptor, i);
    }
    return interceptor;
}

// 1 能够修改参数
// 2 能够修改返回值
// 3 能够阻断继续运行
module.exports = buildInterceptorChain;


