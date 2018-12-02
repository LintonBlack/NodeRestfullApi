/*
* Library for storing and rotating logs
*
*/

// Dependencies
let fs = require('fs');
let path = require('path');
let zlib = require('zlib');


// Container for the module
let lib = {};


// Base directory of the 
lib.baseDir = path.join(__dirname, '/../.logs/');

// Append a string to a file. Create the file if it does not exist.
lib.append = (file, str, callback) => {
    // Open the file for appending
    fs.open(lib.baseDir+file+'.log', 'a', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Apend to the file and close it
            fs.appendFile(fileDescriptor, str+'\n', (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback("Error closing file that was being appended");
                        }
                    })
                } else {
                    callback("Error appending to file");
                }
            })
        } else {
            callback("Could not open file for appending");
        }
    })
}

// List of the logs and optionnally include the compressed logs
lib.list = (includeCompressedLog, callback) => {
    fs.readdir(lib.baseDir, (err, data) => {
        if(!err && data && data.length > 0) {
            let trimmedFileNames = [];
            data.forEach((filename) => {
                // Add the .log files
                if(filename.indexOf('.log') > -1) {
                    trimmedFileNames.push(filename.replace('.log', ''))
                }

                // Add the compressFile .gz file
                if(filename.indexOf('.gz.b64') > -1 && includeCompressedLog) {
                    trimmedFileNames.push(filename.replace('.gz.b64', ''))
                }
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err, data)
        }
    })
}

// Compress the content of one .log file into .gz.b64
lib.compress = (logId, newFiledId, callback) => {
    let sourceFile = logId+'.log';
    let destFile = newFiledId+'.gz.b64';

    // Read the source file
    fs.readFile(lib.baseDir+sourceFile, 'utf-8', (err, inputString) => {
        if(!err && inputString) {
            // Compress data using gzip
            zlib.gzip(inputString, (err, buffer) => {
                if(!err && buffer) {
                    // send the data to destinationFile
                    fs.open(lib.baseDir+destFile, 'wx', (err, fileDescriptor)=> {
                        if(!err && fileDescriptor) {
                            // write to the destination file
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                                if(!err) {
                                    // close destination File
                                    fs.close(fileDescriptor, (err) => {
                                        if(!err) {
                                            callback(false); 
                                        } else {
                                            callback(err);   
                                        }
                                    });
                                } else {
                                    callback(err); 
                                }
                            });

                        } else {
                            callback(err); 
                        }
                    });
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    })

}

// DeCompress the content of one .log file into .gz.b64
lib.decompress = (newFiledId, callback) => {
    newFiledId = newFiledId+'.gz.b64';
    fs.readFile(lib.baseDir+sourceFile, 'utf-8', (err, str) => {
        if(!err && str) {
            // Decompress the data
           let inputBuffer = Buffer.from(str, 'base64');
           zlib.unzip(inputBuffer, (err, outputBuffer) => {
               if (!err && outputBuffer) {
                // Callback
                let str = outputBuffer.toString();
                callback(false, str);
               } else {
                callback(err); 
               }
           })
        } else {
            callback(err);
        }

    })

}

// Truncate
lib.truncate = (logId, callback) => {
    fs.truncate(lib.baseDir+logId+'.log', 0, (err) => {
        if(!err) {
            callback(false);
        } else {
            callback(err);
        }
    })
    
}
// Export the module
module.exports = lib;