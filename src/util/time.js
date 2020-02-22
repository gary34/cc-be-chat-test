"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */

const util = require('util');
const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

function formatDuring(ts) {
    const elements = [];
    if (ts > DAY) {
        const days = Math.floor(ts / DAY);
        elements.push(util.format('%id', days));
        ts = ts % DAY;
    }

    if (ts > HOUR) {
        const hours = Math.floor(ts / HOUR);
        elements.push(util.format('%ih', hours));
        ts = ts % HOUR;
    }
    if (ts > MINUTE) {
        const minutes = Math.floor(ts / MINUTE);
        elements.push(util.format('%im', minutes));
        ts = ts % MINUTE;
    }
    let seconds = 1;
    if (ts > SECOND) {
        seconds = Math.floor(ts / SECOND);
    }
    elements.push(util.format('%is', seconds));
    return elements.join(' ');
}

function timeAgo(ts) {
    const now = new Date().getTime();
    const during = formatDuring(now - ts);
    return `${during} ago`;
}

module.exports = {
    formatDuring, timeAgo, SECOND, MINUTE, HOUR, DAY
};