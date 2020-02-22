"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/20
 */

const fs = require('fs');
const os = require('os');
const logger = require('../util/logger');
let words = [];
const DIRTY_FILE = process.cwd() + '/config/dirty.txt';

function init(cb) {
    load(cb);
}

function load(cb) {
    if (words.length > 0) {
        if (cb) {
            cb(null);
        }
        return;
    }
    fs.readFile(DIRTY_FILE, (err, data) => {
        if (err) {
            throw  err;
        }
        words = data.toString('utf8').split(os.EOL);
        words.sort((a, b) => b.length - a.length);
        logger.Info("load dirty words size:" + words.length);
        buildTrieTree();
        if (cb) {
            cb(null);
        }
    });
}

let trieTree = new Map();
let minLength = 0;
let maxLength = 0;

/**
 * it is a simple trie tree, the same character use a root node .
 * for example: hello , hi .
 *  h -> e->l->l->o->null,
 *    -> i ->null .
 * search sentence is match words just to compare each character from index 0 to max ,unit child is null .
 */
function buildTrieTree() {
    for (let word of words) {
        if (word.length < minLength || minLength == 0) {
            minLength = word.length;
        }
        if (word.length > maxLength) {
            maxLength = word.length;
        }
        let rootNode = trieTree;
        for (let i = 0; i < word.length; i++) {
            const c = word[i];
            let childNode = rootNode.get(c);
            if (!childNode) {
                childNode = new Map();
            }
            if (i === word.length - 1) {
                //cut of long words. for example to two words abc abcd will only use abc
                rootNode.set(c, null);
                break;
            } else {
                rootNode.set(c, childNode);
                rootNode = childNode;
            }
        }
    }
}

// the speed depends on the length of msg
function filter(msg, replace = '*') {
    if (msg.length < minLength || maxLength === 0) {
        return msg;
    }
    const newMsg = [];
    for (let i = 0; i < msg.length;) {
        let matchLength = 0;
        let rootNode = trieTree;
        if (i + minLength > msg.length) {
            for (let s = 0; s < msg.length - i; s++) {
                newMsg.push(msg[i + s]);
            }
            break;
        }
        for (let j = 0; j < maxLength; j++) {
            if (i + j >= msg.length) {
                matchLength = 0;
                break;
            }
            let c = msg[i + j];
            if (rootNode.has(c)) {
                matchLength++;
                let child = rootNode.get(c);
                if (child == null) {
                    break;
                }
                rootNode = child;
            } else {
                matchLength = 0;
                break;
            }
        }
        if (matchLength > 0) {
            for (let s = 0; s < matchLength; s++) {
                newMsg.push(replace);
                i++;
            }
        } else {
            newMsg.push(msg[i]);
            i++;
        }
    }
    return newMsg.join('');
}

// the speed depends on number of dirty words and the length of msg
function filterSimple(msg, replace = '*') {
    if (msg.length < minLength || maxLength === 0) {
        return msg;
    }
    for (let word of words) {
        if (msg.indexOf(word) > 0) {
            msg = msg.replace(word, replace);
        }
    }
    return msg;
}


// benchmark();

module.exports = {
    init, filter, filterSimple
};