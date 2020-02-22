"use strict";

/**
 *
 * @author pugang
 * @date 2020/2/19
 */

const encodePackage = (data) => {
    return JSON.stringify(data);
};

const decodePackage = (str) => {
    return JSON.parse(str);
};

module.exports = {
    encodePackage, decodePackage,
};