'use strict';
const child = require('child_process');
const Promise = require('bluebird');
const exec = Promise.promisify(child.exec);

module.exports = (scripts) => new Promise((resolve, reject) => {
    exec(scripts)
        .then(resolve)
        .catch(reject);
});