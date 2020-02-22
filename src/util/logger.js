"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/16
 */

const colors = require('colors/safe')

function Info(message) {
    console.log(colors.green(message));
}

function Notice(message) {
    console.log(colors.yellow(message));
}

function Warn(message) {
    console.log(colors.magenta(message));
}


function Error(message) {
    console.log(colors.red(message));
}

module.exports = {
    Info, Notice, Warn, Error,
};
