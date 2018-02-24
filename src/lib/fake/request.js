const process = require('process');

module.exports =  async (options) => {
    return new Promise((resolve, reject) => {
        process.emit('request', options, (error, data) => {
            if (error != null) return reject(error);
            resolve(data);
        });
    });
}