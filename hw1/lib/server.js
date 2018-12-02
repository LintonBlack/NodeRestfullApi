/*
* server related tasks
*
*/

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');
const utils = require('util');
const debug = utils.debuglog('server'); 

// Instantiate the server module object

let server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer(function(req,res) {
    server.unifiedServer(req,res);
    
});

// Options https Server
server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pen')),
    'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pen'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(req,res) {
    server.unifiedServer(req,res);
    
});

// All the server logic for both http and https
server.unifiedServer = function(req,res) {
    const parsedUrl = url.parse(req.url, true);

    // get the path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //get the querystring as an object
    let queryStringObject = parsedUrl.query;

    // get the http method
    let method = req.method.toLowerCase();

    // get the headers as an object
    let headers = req.headers;

    let decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', function(data) {
        buffer += decoder.write(data);
    })

    req.on('end', function() {

        buffer += decoder.end();

        let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notfound;

        // construct data obj
        let data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        chosenHandler(data, function(statusCode, payload) {
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

            payload = typeof(payload) === 'object' ? payload : {};

            // convert payload to string to return to the user
            let payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);


        // return green or red color
        if(statusCode == 200) {
            //debug('returning this response', statusCode, payloadString);
            debug('\x1b[32m%s\x1b[0m',method.toUpperCase() + '/' + trimmedPath +' '+ statusCode);
        } else {
            debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + '/' + trimmedPath +' '+ statusCode);
        }
        

        })

      
    })
}


// Define a request router
server.router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
}

// Execute

server.init = function() {
    // Start the HTTP server
    server.httpServer.listen(config.httpPort, function() {
        // debug('\x1b[33m%s\x1b[0m', 'Background workers are running');
        console.log('\x1b[36m%s\x1b[0m', `running server on port ${config.httpPort} now on ${config.envName}`)
    });

    // Start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function() {
        console.log('\x1b[35m%s\x1b[0m',`running server on port ${config.httpsPort} now on ${config.envName}`)
    });
}
// Export the module
module.exports = server;