"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */

const inquirer = require('inquirer');

const ask = (question, cb) => {
    return inquirer.prompt({
        name: "answer",
        type: "input",
        message: question,
    }).then(({answer}) => {
        if (answer.length == 0) {
            ask(question, cb);
        } else {
            cb(answer);
        }

    });
};

module.exports = ask;