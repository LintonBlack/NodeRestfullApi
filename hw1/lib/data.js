/*
* Library for storing and editing data
*
*/

// Dependencies
let fs = require('fs');
let path = require('path');
let helpers = require('./helpers');

// Container for the module (to be exported)
let lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to file
lib.create = (dir, file, data, callback) => {
    // Open the file for writting
    fs.open(lib.baseDir + dir +'/'+ file +'.json', 'wx', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            // Convert data to string
            let stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if(!err) {
                    fs.close(fileDescriptor, (err) => {
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file')
                        }
                    });
                } else {
                    callback('Error writing to new file');
                }
            });
        } else {
            callback('Could not create new file, it may already exist');
        }
    });
}


// Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir +'/'+ file +'.json', 'utf8', (err, data) => {
        if(!err && data) {
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    })
}

// Update data from a file
lib.update = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir +'/'+ file +'.json', 'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            // Convert data to string
            let stringData = JSON.stringify(data);

            // Truncate the file
            fs.truncate(fileDescriptor, (err) => {
                if(!err) {
                    // Write to the file and close it
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if(!err) {
                            fs.close(fileDescriptor, (err) => {
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing file')
                                }
                            })
                        } else {
                            callback('Error writing to new file');
                        }
                    })
                } else {
                    callback('Error truncating file');
                }
            })
        } else {
            callback('Could not open the file for updating, it may exist yet');
        }
    })
}

// Delete data from a file
lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(lib.baseDir + dir +'/'+ file +'.json', (err) => {
        if(!err) {
            callback(false)
        } else {
            callback('Error deleting file');
        }
    })
}

// List all the items in a directory
lib.list = function(dir, callback) {
    fs.readdir(`${lib.baseDir}${dir}/`, (err, data) => {
        if(!err && data && data.length > 0) {
            let trimmedFileNames = [];
            data.forEach((filename) => {
                trimmedFileNames.push(filename.replace('.json', ''));
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err,data);
        }
    })
}
// Export the module
module.exports = lib;

