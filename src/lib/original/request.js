const stream = require('stream');
const Core = require('request');
const process = require('process');

module.exports =  async (options) => {
    if (options.cookies != null) {
        let jar = Core.jar();
        for (let key in options.cookies.content) {
            jar.setCookie(`${key}=${options.cookies.content[key]}`, options.cookies.url);
        }
        options.jar = jar;
    }

    return new Promise((resolve, reject) => {
        let response = {};

        let buffer = Buffer.alloc(0);
        let fileStream = new stream.Stream();
        fileStream.writable = true;
        fileStream.write = (chunk) => {
            buffer = Buffer.concat([buffer, chunk], buffer.length+chunk.length);
        };
        fileStream.end = () => {
            fileStream.writable = false;
            fileStream.readable = true;
            response.body = buffer;
            return resolve(response);
        };

        Core(options, (error, resp, body) => {
            if (error)  return reject(error);
            response.status = resp.statusCode;
        }).pipe(fileStream);
    });
}