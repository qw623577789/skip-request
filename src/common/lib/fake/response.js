const process = require('process');
const should = require("should");
const mimeType  = require('mime-types');
const mutex = require("key_mutex").mutex();
const Constant = require('../../constant');

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
                callback(null, {
                    request: options,
                    response: serializeResponse
                });
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

    get time() {
        return this._time;
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
        this._statusMessage = 'OK';
        this._body = null;
        this._headers = {
            'content-type': Constant.ContentType.TEXT
        }
    }

    status(status, statusMessage) {
        this._status = status;
        this._statusMessage = statusMessage;
        return this;
    }

    text(text) {
        should(text).be.String();
        this._body = new Buffer(text);
        this._headers['content-type'] = Constant.ContentType.TEXT;
        return this;
    }

    xml(text) {
        should(text).be.String();
        this._body = new Buffer(text);
        this._headers['content-type'] = Constant.ContentType.XML;
        return this;
    }

    json(object) {
        should(object).be.Object();
        this._body = new Buffer(JSON.stringify(object));
        this._headers['content-type'] = Constant.ContentType.JSON;
        return this;
    }

    file(filePath) {
        const fs = require('fs');
        if(!fs.existsSync(filePath)) throw new Error('file is not exist');
        this._body = fs.readFileSync(filePath);
        this._headers['content-type'] = mimeType.lookup(filePath);
        return this;
    }

    serialize() {
        return {
            status: this._status,
            statusMessage: this._statusMessage,
            httpVersion: 'HTTP/1.1',
            headers: this._headers,
            body: this._body
        }
    }
}