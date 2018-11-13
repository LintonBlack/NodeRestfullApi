/*
Create and export configuration variables
*
*/

// Container for all the environments
let environments = {};

environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxChecks' : 5,
    'twilio' : {
        'accountSid' : 'AC7359c1f72f37050a825a4aaa6f5f42f1',
        'authToken' : '3adb41640235bff0092aa9903ab1450b',
        'fromPhone' : '+33610043320'
    }
};


environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret': 'thisIsAlsoASecret',
    'maxChecks' : 5,
    'twilio' : {
        'accountSid' : 'AC7359c1f72f37050a825a4aaa6f5f42f1',
        'authToken' : '3adb41640235bff0092aa9903ab1450b',
        'fromPhone' : '+33610043320'
    }
};
// Determine which environment was passed as a command-line argument
let currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check taht the current environment is one of the environments above, default is staging
let environmentsToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

// Export  the module
module.exports =  environmentsToExport;