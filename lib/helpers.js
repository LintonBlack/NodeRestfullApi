/*
*Helpers for various tasks
*
*/

// Dependencies
let crypto = require('crypto');
let config = require('./config');
let querystring = require('querystring');
let https = require('https');

// Container for all the helpers
let helpers = {};

// Create a SHA256 hash
helpers.hash = function(str) {
    if(typeof(str) == 'string' && str.length > 0) {
        return hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    } else {
        return false;
    }
}

// Parse a Json string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
    try{
        let obj = JSON.parse(str);
        return obj;
    }
    catch(e) {
        return {};
    } 
}

// Create a string of a random alphanumeric characters, of a given length
helpers.createRandomString = function(strlength) {
    strlength = typeof(strlength) == 'number' && strlength > 0 ? strlength : false;
    if (strlength) {
        // Define all the possible characters that could go into a string
        let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // Start the final string
        let str = '';
        for(i = 0; i<strlength; i++) {
            // Get a random character from the possibleCharacters
            let randomCharacter =  possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the final string
            str+= randomCharacter;
        }

        // return the final string
        return str;

    } else {
        return false;
    }
}

// Create a string of a random alphanumeric characters, of a given length
helpers.sendTwilioSms = function(phone, msg, callback) {
   phone = typeof(phone) == 'string'  && phone.trim().length == 10 ? phone.trim() : false;
   msg = typeof(msg) == 'string'  && msg.trim().length > 0 && msg.trim().length < 100 ? msg : false;

    if (phone && msg) {
        // Configure the request payload
        let payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+1'+ phone,
            'Body' : msg
        }

        let stringPayload = querystring.stringify(payload);

        // Configure the request details

        let requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twillo.com',
            'method': 'POST',
            'path' : `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
            'auth' : `${config.twilio.accountSid}:${config.twilio.authToken}`,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        let req = https.request(requestDetails, function(res) {
            // Grab the status of the sent request
            const status = res.statusCode;
            if(status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned alue was '+ status)
            }
        });

        // Bind to the error
        req.on('error', function(e) {
            callback(e);
        });

        // Add the payload 
        req.write(stringPayload);

        // End the request
        req.end();

    } else {
        callback('Given parameters were missing or invalid');
    }
}

// Export the module
module.exports = helpers;