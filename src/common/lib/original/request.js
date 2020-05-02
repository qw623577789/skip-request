const Core = require('request');

module.exports =  async (options) => {
    if (options.cookies != null) {
        let jar = Core.jar();
        for (let key in options.cookies.content) {
            jar.setCookie(`${key}=${options.cookies.content[key]}`, options.cookies.url);
        }
        options.jar = jar;
    }

    return new Promise((resolve, reject) => {
        Core(options, (error, resp) => {
            //support for multipart/form-data har
            if (error != undefined) return reject(error);
            if (options.formData != undefined) {
                options.headers = Object.assign(options.headers, resp.request.headers)
            }
            let response = {
                status: resp.statusCode,
                statusMessage: resp.statusMessage,
                headers: resp.headers,
                httpVersion: 'HTTP/' + resp.httpVersion,
                body: resp.body
            }
            return resolve({
                request: options,
                response
            });
        });
    });
}