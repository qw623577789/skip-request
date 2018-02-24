const process = require('process');
const should = require("should");
const mutex = require("key_mutex").mutex();

module.exports =  class FResponse {
    constructor() {
        this._handlers = new Map();
        
        process.on('request', async (options, callback) => {
            try {
                let handlers = this._handlers.get(options.method);
                let handler = handlers.find((handler) => {
                    let regexp = new RegExp(handler.url);
                    return regexp.test(options.url);
                });
                if (handler == undefined) throw new Error(`can not find fake ${handler.url} hanlder`);
                let request = new _Request(options);
                let response = new _Response();
                await handler.callback(request, response);
                let serializeResponse = response.serialize();
                callback(null, {status: serializeResponse.status, body: serializeResponse.body})
            }
            catch(error){
                callback(error, null);
            }
        })
    }

    async post(url, callback) {
        await mutex.lock('requester-fake', async () => {
            let handlers = this._handlers.get('post');
            if (handlers == undefined) handlers = [];
            handlers.push({
                url: url,
                callback: callback
            });   
            this._handlers.set('post', handlers);
        });
    }

    async get(url, callback) {
        await mutex.lock('requester-fake', async () => {
            let handlers = this._handlers.get('get');
            if (handlers == undefined) handlers = [];
            handlers.push({
                url: url,
                callback: callback
            });   
            this._handlers.set('get', handlers);
        });
    }
}

class _Request {
    constructor(options) {
        this._timeout = options.timeout;
        this._headers = options.headers;
        this._body = options.body;
        this._formData = options.formData;
        this._cookies = options.cookies != null ? options.cookies.content : null;
        this._query = options.qs;
        this._method = options.method;
        this._url = options.url;
    }

    get url() {
        return this._url;
    }

    get method() {
        return this._method;
    }

    get timeout() {
        return this._timeout;
    }

    get cookies() {
        return this._cookies;
    }
    
    get query() {
        return this._query;
    }

    get headers() {
        return this._headers;
    }

    get body() {
        switch(this._headers['content-type']) {
            case 'text/plain':
            case 'text/xml':
                return this._body;
            case 'application/json':
                return JSON.parse(this._body);
            case 'application/x-www-form-urlencoded':
                return this._body.split('&').reduce((body, item) => {
                    let [key, value] = item.split('=');
                    body[key] = value;
                    return body;
                }, {});
            case 'multipart/form-data':
                return this._formData;
            default:
                throw new Error("unsupport contentType");
        }
    }

}

class _Response {
    constructor(options) {
        this._status = 200;
        this._body = null;
    }

    status(status = 200) {
        this._status = status;
        return this;
    }

    text(text) {
        should(text).be.String();
        this._body = text;
        return this;
    }

    json(object) {
        should(object).be.Object();
        this._body = JSON.stringify(object);
        return this;
    }

    file(filePath) {
        const fs = require('fs');
        if(!fs.existsSync(filePath)) throw new Error('file is not exist');
        this._body = fs.readFileSync(filePath);
        return this;
    }

    serialize() {
        return {
            status: this._status,
            body: this._body
        }
    }
}