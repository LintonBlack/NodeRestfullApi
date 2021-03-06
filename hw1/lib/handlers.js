/*
* Request handlers
*
*/

// Dependencies
let _data = require('./data');
let helpers = require('./helpers');
let config = require('./config');

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

        // Get the token from the headers
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            // 
            if(tokenIsValid) {
                // Lookup the user
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
                callback(403, { 'Error' : 'Missing required token in header, or token is invalid'})
            }
        });
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


        // Get the token from the headers
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            // 
            if(tokenIsValid) { 
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
            }
            else {
                callback(403, { 'Error' : 'Missing required token in header, or token is invalid'});
            }})
                
            } else {
                callback(400, { 'Error' : 'Missing fileds to update'});
            }
        } else {
        callback(400, { 'Error' : 'Missing required field'});
    }
};

// Users - delete
handlers._users.delete = function(data, callback) {
    let phone = typeof(data.queryStringObject.phone) == 'string'  && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if(phone) {
        // Get the token from the headers
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if(tokenIsValid) { 
                _data.read('users', phone, function(err,data) {
                    if(!err && data) {
                        _data.delete('users', phone, function(err) {
                            if(!err) {
                               // Delete each of the checks associated with the user
                               let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                let checksToDelete = userChecks.length;
                                if(checksToDelete > 0) {
                                    let checksToDeleted = 0;
                                    let deletionErrors = false;

                                    // Loop through the checks
                                    userChecks.forEach(function() {
                                        if(err) {
                                            deletionErrors = true;
                                        } else {
                                            checksToDeleted++;
                                            if(checksToDeleted == checksToDelete) {
                                                if(!deletionErrors) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {'Error' : 'Errors encountered while attemting to delete check. Check have may not been deleted successfully'});
                                                }
                                            }
                                        }
                                    })
                                } else {

                                }
                            } else {
                                callback(500, {'Error' : 'Could not delete the specified user'})
                            }
                        })
                    } else {
                        callback(400, { 'Error' : 'Could not find the specified user'});
                    }
                })
            }
            else {
                callback(403, { 'Error' : 'Missing required token in header, or token is invalid'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Tokens
handlers.tokens = function(data, callback) {
    let acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405)
    }
    
}


// Container for all the tokens methods
handlers._tokens = {};

// Required data : phone, password
// optional data : none
// Tokens - post
handlers._tokens.post = function(data, callback) {
    // Check for the required field
    let phone = typeof(data.payload.phone) == 'string'  && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    console.log("here");
    if (phone || password) {
        _data.read('users', phone, function(err, userData) {
            if(!err && userData) {
                // Hash the password
                const hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.password) {
                    // create a token
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60;
                    let tokenObject = {
                        'phone' : phone,
                        'id' : tokenId,
                        'expires' : expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(err) {
                        if(!err) {
                            callback(200, tokenObject)
                        } else {
                            callback(500, { 'Error' : ' Could not create a new Token'})
                        }
                    })
                } else {
                    callback(400, { 'Error' : 'Password did not match the specief user\'s stored password'})
                }
            } else {
                callback(400, { 'Error' : 'Could not find the specified user'})
            }
        })
    } else {
        callback(400, { 'Error' : 'Missing required field(s)'})
    }
}

// Required data : id
// optional data : none
// Tokens - get
handlers._tokens.get = function(data, callback) {
    let id = typeof(data.queryStringObject.id) == 'string'  && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        // Look up the token
        _data.read('tokens', id, function(err,tokenData) {
            if(!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
}

// Tokens - put
// Required data : id, extend 
// Optional data : none
handlers._tokens.put = function(data, callback) {
    let id = typeof(data.payload.id) == 'string'  && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    let extend = typeof(data.payload.extend) == 'boolean'  && data.payload.extend == true ? true : false;

    if (id || extend) {
        // Look up the token
        _data.read('tokens', id, function(err,tokenData) {
            if(!err && tokenData) {
                // Check to make sure the token isn't already expired
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    // Store the new update
                    _data.update('tokens', id, tokenData, function(err) {
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'Error' : 'Could not update the token\'s expiration'});
                        }
                    })
                } else {
                    callback(400, { 'Error' : 'The token has already expired, and cannot be extended'})
                }
            } else {
                callback(400, { 'Error' : 'Specified token does not exist'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field(s) or fields are invalid'});
    }
}

// Tokens - delete
handlers._tokens.delete = function(data, callback) {
    let id = typeof(data.queryStringObject.id) == 'string'  && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    if(id) {
        _data.read('tokens', id, function(err,tokenData) {
            if(!err && tokenData) {
                _data.delete('tokens', id, function(err) {
                    if(!err) {
                        callback(200)
                    } else {
                        callback(500, {'Error' : 'Could not delete the specified token'})
                    }
                })
            } else {
                callback(400, { 'Error' : 'Could not find the specified token'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
        if(!err && tokenData) {
            // Check that the token is for the given user and has not expired
            if(tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
}

// Tokens
handlers.checks = function(data, callback) {
    let acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405)
    }
    
}

// Containers for all the checks methods
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeOutSeconds
handlers._checks.post = function(data, callback) {

    // validat input
    let protocol = typeof(data.payload.protocol) == 'string'  && ['https', 'http'].indexOf(data.payload.protocol) > -1? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string'  && data.payload.url.trim().length > 0 ? data.payload.url : false;
    let method = typeof(data.payload.method) == 'string'  && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1? data.payload.method : false;
    let successCodes = typeof(data.payload.successCodes) == 'object'  && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0? data.payload.successCodes : false;
    let timeOutSeconds = typeof(data.payload.timeOutSeconds) == 'number'  && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds > 1 && data.payload.timeOutSeconds <=5 ? data.payload.timeOutSeconds : false;

    if ( protocol && url && method && successCodes && timeOutSeconds) {
        // Get the token from the header
        let token = typeof(data.headers.tokens) == 'string' ? data.headers.tokens : false;

        // Lookup the user by reading the token
        _data.read('tokens', token, function(err, tokenData) {
            console.log(tokenData)
            if(!err && tokenData) {
                
                let userPhone = tokenData.phone;

                // Look up user data
                _data.read('users', userPhone, function(err, userData) {
                    console.log(userData)
                    if (!err && userData) {
                        let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        // Verify that the user has less than the number of max-checks-per-user
                        if(userChecks.length < config.maxChecks) {
                            // Create a random id for the check
                            let checkId = helpers.createRandomString(20);

                            // Create the checkObject and include the user's phone
                            let checkObject = {
                                'id' : checkId,
                                'userPhone' : userPhone,
                                'protocol' : protocol,
                                'url' : url,
                                'method' : method,
                                'timeOutSeconds' : timeOutSeconds,
                                'successCodes' : successCodes,
                            };

                            _data.create('checks', checkId, checkObject, function(err) {
                                if(!err) {
                                    // Add the check id to the user data
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the new user data
                                    _data.update('users', userPhone, userData, function(err) {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, { 'Error' : 'Could not update the user with the new check'})
                                        }
                                    })
                                } else {
                                    callback(500, { 'Error' : 'Could not create the new check'})
                                }
                            })
                        } else {
                            callback(400, { 'Error' : `The user aöready has a maximum of checks (${config.maxChecks})`});
                        }
                    } else {
                        callback(403);
                    }
                }) 
            } else {
                callback(403);
            }
        })

    } else {
        callback(400, { 'Error' : 'Missing required inputs, or inputs are invalid'});
    }
}


// Checks - get
// Required data: id
// Required data : none

handlers._checks.get = function(data, callback) {
    let id = typeof(data.queryStringObject.id) == 'string'  && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.phone.id() : false;

    if(id) {
        // Lookup the check
        _data.read('checks', id, function(err, checkData) {
            if(!err && checkData) {
                // Get the token from the headers
                let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // Verify that the given token is valid and belongs to the user who created thecheck
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
                    if(tokenIsValid) {
                        // Return the check data
                     callback(200, checkData)
                    } else {
                        callback(403)
                    }
                });
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
};

// Checks - put
// Required data: id
// Required data : protocol, url, succesCodes, timeOutSeconds (one must be sent)

handlers._checks.put = function(data, callback) {
    // Check for the required field
    let id = typeof(data.payload.id) == 'string'  && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    
    // Check for the optional fields
    let protocol = typeof(data.payload.protocol) == 'string'  && ['https', 'http'].indexOf(data.payload.protocol) > -1? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string'  && data.payload.url.trim().length > 0 ? data.payload.url : false;
    let method = typeof(data.payload.method) == 'string'  && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1? data.payload.method : false;
    let successCodes = typeof(data.payload.successCodes) == 'object'  && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0? data.payload.successCodes : false;
    let timeOutSeconds = typeof(data.payload.timeOutSeconds) == 'number'  && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds > 1 && data.payload.timeOutSeconds <=5 ? data.payload.timeOutSeconds : false;

    // Error if the id is invalid

    if(id) {
        // Check to make sure one or more optional fields have been sent

            if (protocol || url || method || successCodes || timeOutSeconds) {
                _data.read('checks', id, function(err, checkData) {
                    if(!err && checkData) {
                           // Get the token from the headers
                           let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                           // Verify that the given token is valid for the phone number
                           handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
                           // 
                           if(tokenIsValid) {
                               // Update the check where necessary
                               if(protocol) {
                                   checkData.protocol = protocol;
                               }

                               if(url) {
                                    checkData.url = url;
                                }

                                if(method) {
                                    checkData.method = method;
                                }

                                if(successCodes) {
                                    checkData.successCodes = successCodes;
                                }

                                if(timeOutSeconds) {
                                    checkData.timeOutSeconds = timeOutSeconds;
                                }

                                // Store the new updates
                                _data.update('check', id, checkData, function(err) {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        callback(500, { 'Error' : 'Could not update the check'});
                                    }
                                })
                           } else {
                            callback(403);
                           }
                       })
                    } else {
                        callback(400, { 'Error' : 'Check ID did not exist'});
                    }
                })
                
            } else {
                callback(400, { 'Error' : 'Missing fields to update'});
            }
        } else {
        callback(400, { 'Error' : 'Missing required field'});
    }
};

// Checks - delete
// Required data: id
// Required data : none

handlers._checks.delete = function(data, callback) {
    let id = typeof(data.queryStringObject.id) == 'string'  && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    if(id) {
        // Lookup the check
        _data.read('checks', id, function(err, checkData) {
            if(!err && checkData) {
                // Get the token from the headers
                let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // Verify that the given token is valid for the phone number
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
                    if(tokenIsValid) { 
                        // delete the check data
                        _data.delete('checks', id, function(err) {
                            if(!err) {
                                   // Lookup user
                                _data.read('users', checkData.userPhone, function(err,userData) {
                                    if(!err && userData) {
                                        let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        // Remove the delete check from their list of checks
                                        let checkPosition = userChecks.indexOf(id);
                                        if(checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            // Re-save the user's data
                                            _data.update('users', checkData.userPhone, userData, function(err) {
                                                if(!err) {
                                                    callback(200)
                                                } else {
                                                    callback(500, {'Error' : 'Could not update the user'})
                                                }
                                            })
                                        } else {
                                            callback(500, {'Error' : 'Could not find the check on the user\'s object'})
                                        }
                                    } else {
                                        callback(500, { 'Error' : 'Could not find the user who created the check'});
                                    }
                                })
                            } else {
                                callback(500, {'Error' : 'Could not delete the check '})
                            }
                        })
                    }
                    else {
                        callback(403);
                    }
                })
            } else {
                
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