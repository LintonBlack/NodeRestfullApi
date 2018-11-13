/*
* workers related tasks
*
*/

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const _data = require('./data');
const url = require('url');
const helpers = require('./helpers');

// Instantiate the workers object
let workers = {};

// Lookup all check, get their data, send to validator
workers.gatherAllChecks = () => {
    _data.list('checks', (err, checks) => {
        if(!err && checks && checks.length > 0) {
            checks.forEach((check) => {
                _data.read('checks', check, (err, originalCheckData) => {
                    if(!err && originalCheckData) {
                        // Pass it to the check validator, and let that function continue or loop
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log("Error reading one of the check's data");
                    }
                })
            })
            // Read in the check data
        } else {
            console.log("Error: could not find any checks to process");
        }
    })
 }

// Sanity-check the check-data
workers.validateCheckData = (originalCheckData) => {
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData != null ? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id) == 'string'  && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string'  && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string'  && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string'  && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string'  && ['get', 'post', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object'  && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes: false;
    originalCheckData.timeOutSeconds = typeof(originalCheckData.timeOutSeconds) == 'number'  && originalCheckData.timeOutSeconds % 1 === 0 && originalCheckData.timeOutSeconds >= 1 && originalCheckData.timeOutSeconds <=5 ? originalCheckData.timeOutSeconds : false;

    // Set the keys that may not be set ( if the workers have never seen this check before)
    originalCheckData.state = typeof(originalCheckData.state) == 'string'  && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : false;
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number'  && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;
    console.log(originalCheckData.id + " / " + originalCheckData.userPhone + " / " + originalCheckData.protocol + " / " + originalCheckData.url + " / " + originalCheckData.method + " / " + originalCheckData.successCodes + " / " + originalCheckData.timeOutSeconds + " / " + originalCheckData.state + " / " + originalCheckData.lastChecked)
    if (originalCheckData.id && originalCheckData.userPhone && originalCheckData.protocol && originalCheckData.url && originalCheckData.method && originalCheckData.successCodes && originalCheckData.timeOutSeconds) {
            workers.performCheck(originalCheckData)
    } else {
        console.log('Error: One of the checks is not properly formatted. Skipping it')
    }
}

// Perform the check, send the originalCheckDtat and the outcome of the check process to the next step in the process
workers.performCheck = (originalCheckData) => {
    // Prepare the initial check outcome
    let checkOutcome = {
        'error' : false,
        'responseCode' : false
    };

    // Mark that the outcome has not been sent yet
    var outcomeSent = false;

    // Parse the hostname and the path out of the original check data
    let parsedUrl = url.parse(`${originalCheckData.protocol}://originalCheckData.url`);
    let hostName = parsedUrl.hostname;
    let path = parsedUrl.path; // We want the full query string

    // Construct the rquest
    let requestDetails = {
        'protocol' : `${originalCheckData.protocol}:`,
        'hostname' : hostName,
        'method': originalCheckData.method,
        'path' : path,
        'timeout' : originalCheckData.timeOutSeconds * 1000
    };

    // Instantiate the request obj (using http or http module);
    let _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    let req = _moduleToUse.request(requestDetails, (res) => {
        // Grab the status
        let status = res.statusCode;

        // Update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', (e) => {
        // Update the checkouttcome
        checkOutcome.err = {
            'error' : true,
            'value' : e
        };

        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true; 
        }
    });

    // Bind to the tiemout event
    req.on('timeout', (e) => {
        // Update the checkouttcome
        checkOutcome.err = {
            'error' : true,
            'value' : 'timeout'
        };

        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true; 
        }
    });

    // End the request
    req.end();
}

// Process the checkoutcome, update the check data as needed, trigger an alert if neede
// Special logic for accomodating a check that has never been tested before
workers.processCheckOutcome = (originalCheckData,checkOutcome) => {
    // Decide if the check is considered up or down
    let state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // decide if an alert is warranted
    let alertWarranted = originalCheckData.lastChecked && originalCheckData.state != state ? true : false;

    // Update the check data
    let newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    // Save the updates
    _data.update('checks', newCheckData.id, newCheckData, (err) => {
        if(!err) {
            if(!alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log("Check outcome has not changed, no alert needed")
            }
        } else {
            console.log("Error trying to save updates to one of the checks")
        }
    })
}

// Alert the user as to change in their check status
workers.alertUserToStatusChange = (newCheckData) => {
    let msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + '' + newCheckData.protocol+'://'+ newCheckData.url+' is currently '+ newCheckData.state;

    //helper 
    helpers.sendTwilioSms(newCheckData.userPhone, msg, (err) => {
        console.log(err)
        if(!err) {
            console.log("Success: User was alerted to a status change in their check, via sms");
        } else {
            console.log("Error: Could not alert the user to a status change in their check, via sms")
        }
    });
};

// Timer to execute the worker-process once per minute
workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    },
    1000 * 60
    )
}

// Execute workers

workers.init = () => {
    // Execute all the checks immediatly
    workers.gatherAllChecks();

    // Call the loop so the checks will execute later on
    workers.loop();
}

// Export module
module.exports = workers;