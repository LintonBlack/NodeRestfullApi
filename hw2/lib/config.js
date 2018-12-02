/**
 * 
 * Creating and exporting configuration variables
 * 
 */

// Dependencies

let environments = {};

// Staging (default) environment
environments.staging = {
    httpPort : 3000,
    httpsPort: 3001,
    envName : 'staging',
    hashingSecret : 'thisIsASecret',
    maxChecks :  1,
    currency : 'usd',
    stripe : process.env.PAY_API_KEY,
    mailGun : {
        apiKey : process.env.MAIL_API_KEY,
        from : 'sandboxc408ff9218ce4310a32d85db2acafb5c.mailgun.org',
        domain : 'sandboxc408ff9218ce4310a32d85db2acafb5c.mailgun.org'
    }
};

// Production environment
environments.production = {
    httpPort : 5000,
    httpsPort: 5001,
    envName : 'production',
    hashingSecret : 'thisIsAlsoASecret',
    maxChecks :  1,
    currency : 'usd',
    stripe : process.env.PAY_API_KEY,
    mailGun : {
        apiKey : process.env.MAIL_API_KEY,
        from : 'sandboxc408ff9218ce4310a32d85db2acafb5c.mailgun.org',
        domain : 'sandboxc408ff9218ce4310a32d85db2acafb5c.mailgun.org'
    }
};

// Determine wich environment was passed as command line argument
let currentEnvironment = typeof( process.env.NODE_ENV ) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments avobe, if not, default to staging
let environmentToExport = typeof( environments[ currentEnvironment ] ) === 'object' ? environments[ currentEnvironment ] : environments.staging;

// Export the module
module.exports = environmentToExport;