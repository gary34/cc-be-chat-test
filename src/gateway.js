"use strict";

/**
 * for client get a available server.
 * TODO add load balance return the server. (round robin, weight,random,keep session...)
 * @author pugang
 * @date 2020/2/20
 */

const http = require('http');
const url = require('url');
const redis = require('redis');
const config = require(process.cwd() + '/config' + '/gatewayConfig');
const {logger} = require('./util');
const {randInt} = require('./util/random');
const {promisify} = require('util');
const querystring = require('querystring');
const redisClient = redis.createClient(config.redisUrl);

const redisGetAsync = promisify(redisClient.get).bind(redisClient);

redisClient.once('ready', function () {
    logger.Info("redis ready!");
});

http.createServer(async function (request, response) {
    const requestURL = url.parse(request.url);
    if (requestURL.path.indexOf('/server') >= 0) {
        response.writeHead(200, {'Content-Type': 'application/json'});
        const server_str = await redisGetAsync('server_list');
        const servers = JSON.parse(server_str);
        if (requestURL.query) {
            const {all = false} = querystring.parse(requestURL.query);
            if (all) {
                response.end(JSON.stringify(servers), 200);
                return;
            }
        }
        if (servers.length > 0) {
            const server = servers[randInt(servers.length)];
            response.end(JSON.stringify(server), 200);
        } else {
            response.end(JSON.stringify({}), 200);
        }
    } else {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('invalided request');
    }
}).listen(config.port);

logger.Info("gateway start listen :" + config.port);