/*
* Request handlers
*
*/

// Dependencies
let _data = require('./data');
let helpers = require('./helpers');

// Define handlers
let handlers = {};


// Users
handlers.users = function(data, callback) {
    let acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405)
    }
    
}

// Container for the user submethods
handlers._users = {};

// Users - post
// Require data : firstName, lastName, phone, password, tosAgreement
// Optional data: none;
handlers._users.post = function(data, callback) {
    // Check that all required filed are filled out
    let firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    let tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesn't alerady exist
        _data.read('users', phone, function(err, data) {
            if (err) {
                // Hash the password
                let hashedPassword = helpers.hash(password);

                // Create the user obj

                if (hashedPassword) {
                    let userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'password' : hashedPassword,
                        'tosAgreement' :  true
    
                    }
    
                    // Store the user
                    _data.create('users', phone, userObject, function(err) {
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'Error' : 'Could not create User'})
                        }
                    })
                } else {
                    callback(500, { 'Error' : 'Could not hash password of the User'})
                }
                
                 
            } else {
                // User already exist
                callback(400, {'Error' : ' A user with that phone number already exists'})
            }
        })

    } else {
        callback(400, { 'Error' : 'Missing required fields'});
    }
};

// Users - get
handlers._users.get = function(data, callback) {
    let phone = typeof(data.queryStringObject.phone) == 'string'  && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if(phone) {
        _data.read('users', phone, function(err,data) {
            if(!err && data) {
                console.log(data)
                // Remove the hashed password from the user
                delete data.password;
                callback(200, data);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Users - put
handlers._users.put = function(data, callback) {
    // Check for the required field
    let phone = typeof(data.payload.phone) == 'string'  && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    // Optional
    let firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid

    if(phone) {
        // Error if nothing is sent to update

            if (firstName || lastName || password) {
                // Lookup user
                _data.read('users', phone, function(err, userData) {
                    if(!err && userData) {
                        // Update the fields necessary
                        if (firstName) {
                            userData.firstName = firstName;
                        }

                        if(lastName) {
                            userData.lastName = lastName;
                        }

                        if(password) {
                            userData.password = helpers.hash(password);
                        }

                        // Store the new update
                        _data.update('users', phone, userData, function(err) {
                            if(!err) {
                                callback(200);
                            } else {
                                console.log(err);
                                callback(500, { 'Error' : 'Could not update the user'});
                            }
                        })
                    } else {
                        callback(400, { 'Error' : 'The specified user does not exist'});
                    }
                })
            } else {
                callback(400, { 'Error' : 'Missing fileds to update'})
            }
        } else {
        callback(400, { 'Error' : 'Missing required field'})
    }
};

// Users - delete
handlers._users.delete = function(data, callback) {
    let phone = typeof(data.queryStringObject.phone) == 'string'  && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if(phone) {
        _data.read('users', phone, function(err,data) {
            if(!err && data) {
                _data.delete('users', phone, function(err) {
                    if(!err) {
                        callback(200)
                    } else {
                        callback(500, {'Error' : 'Could not delete the specified user'})
                    }
                })
            } else {
                callback(400, { 'Error' : 'Could not find the specified user'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};


// Ping
handlers.ping = function(data, callback) {
    callback(200)
}

// Not Found
handlers.notfound = function(data, callback) {
    callback(404)
}

// Export the module

module.exports = handlers;