const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');
//va const _data = require('./lib/data');


// TESTING
// @TODO delete the test

//_data.create('test', 'newFile', { 'foo': 'bar'}, function(err) { console.log('this was the error', err)});
//_data.read('test', 'newFile', function(err, data) { console.log('this was the error', err, ' and this was the data', data)});
//_data.update('test', 'newFile', { 'Michel': 'Tell'}, function(err) { console.log('this was the error', err)});
//_data.delete('test', 'newFile', function(err) { console.log('this was the error', err)});


// Instantiate the HTTP server
const httpServer = http.createServer(function(req,res) {
    unifiedServer(req,res);
    
});

// Start the server
httpServer.listen(config.httpPort, function() {
    console.log(`running server on port ${config.httpPort} now on ${config.envName}`)
});

// Options https Server
let httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pen'),
    'cert' : fs.readFileSync('./https/cert.pen')
};

const httpsServer = https.createServer(httpsServerOptions, function(req,res) {
    unifiedServer(req,res);
    
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function() {
    console.log(`running server on port ${config.httpsPort} now on ${config.envName}`)
});

// All the server logic for both http and https
let unifiedServer = function(req,res) {
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

        let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notfound;

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
        //
        console.log('returning this response', statusCode, payloadString);

        })

      
    })
}

 
const router = {
    'ping' : handlers.ping,
    'users' : handlers.users
}