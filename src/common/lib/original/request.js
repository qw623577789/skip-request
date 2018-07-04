const stream = require('stream');
const Core = require('request');
const moment = require('moment');
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
            return resolve({
                request: options,
                response: response
            });
        };
        
        Core(options, (error, resp, body) => {
            //support for multipart/form-data har
            if (error != undefined) throw error;
            if (options.formData != undefined) {
                options.headers = Object.assign(options.headers, resp.request.headers)
            }
            response.status = resp.statusCode;
            response.statusMessage = resp.statusMessage;
            response.headers = resp.headers;
            response.httpVersion= 'HTTP/' + resp.httpVersion;
        }).pipe(fileStream);

        



    });
}