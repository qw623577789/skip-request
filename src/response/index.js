const moment = require('moment');
const fs = require('fs');
const url = require('url');
const Stream = require('stream');
const path = require('path');
const mime = require('mime-types')
const iconv = require('iconv-lite');
const Constant = require('../common/constant');
const parseXml = require('fast-xml-parser').parse;
module.exports = class {
    constructor({ request, response: { status, statusMessage, headers, httpVersion, body } }) {
        this._request = request;
        this._status = status;
        this._statusMessage = statusMessage;
        this._headers = headers;
        this._httpVersion = httpVersion;
        this._body = body;
        this._time = moment();
        this._character = 'utf8';
    }

    get status() {
        return this._status
    }

    get headers() {
        return this._headers;
    }

    get httpInfo() {
        return {
            startedDateTime: this._request.time.format(),
            time: this._time.diff(this._request.time),
            request: this._httpInfoRequest(),
            response: this._httpInfoResponse()
        };
    }

    characterEncoding(character = "utf8") {
        this._character = character;
        return this;
    }

    toJson() {
        let body = this._decode(this._body);
        let jsonObject = this._tryParseJsonTextToJson(body) || this._tryParseXmlTextToJson(body);
        return jsonObject;
    }

    toString() {
        return this._decode(this._body);
    }

    toBuffer() {
        return this._body;
    }

    toFile(filePath) {
        fs.writeFileSync(filePath, this._body);
        return filePath;
    }

    _decode(buffer) {
        if (this._character !== 'utf8') {
            return iconv.decode(buffer, this._character);
        }
        else {
            return buffer.toString();
        }
    }

    _tryParseJsonTextToJson(text) {
        try {
            let object = JSON.parse(text);
            if (!['object', 'number', 'boolean', 'string', 'array'].includes(typeof object)) return false;
            return object;
        }
        catch (error) {
            return undefined;
        }
    }

    _tryParseXmlTextToJson(text) {
        try {
            return parseXml(text);
        }
        catch (error) {
            return undefined;
        }
    }

    _httpInfoRequest() {
        let request = {
            url: this._request.url + (this._request.qs == undefined ? '' : "?" + Object.keys(this._request.qs).map(key => `${key}=${this._request.qs[key]}`).join('&')),
            method: this._request.method,
            cookies: [],
            headers: [],
            postData: undefined
        }

        if (this._request.cookies != undefined) {
            let { host, pathname } = url.parse(this._request.url);
            for (let key in this._request.cookies.content) {
                request.cookies.push({
                    name: key,
                    value: this._request.cookies.content[key],
                    path: pathname,
                    domain: host
                });
            }
        }

        if (this._request.headers != undefined) {
            for (let key in this._request.headers) {
                request.headers.push({
                    name: key,
                    value: this._request.headers[key],
                });
            }
        }

        if (this._request.method == "post") {
            let text = undefined;
            if (this._request.formData != undefined) {
                if (this._request.headers["content-type"].indexOf('boundary=') != -1) {
                    let split = this._request.headers["content-type"].split('boundary=')[1];
                    let content = Object.keys(this._request.formData).map(key => {
                        if (this._request.formData[key] instanceof Stream) {
                            let filename = path.basename(this._request.formData[key].path);
                            let contentType = this._getContentType(filename);
                            return `--${split}\r\nContent-Disposition: form-data; name=\"${key}\";filename=\"${filename}\"\r\nContent-Type:${contentType}\r\n\r\n...\r\n`;
                        }
                        else if ( //buffer形式文件
                            typeof this._request.formData[key] === 'object' &&
                            (
                                Buffer.isBuffer(this._request.formData[key].value) ||
                                this._request.formData[key].value instanceof Stream
                            ) &&
                            typeof this._request.formData[key].options === 'object'
                        ) {
                            let { filename, contentType = "" } = this._request.formData[key].options;
                            if (contentType === "") contentType = this._getContentType(filename);
                            return `--${split}\r\nContent-Disposition: form-data; name=\"${key}\";filename=\"${filename}\"\r\nContent-Type:${contentType}\r\n\r\n...\r\n`;
                        }
                        else if (typeof this._request.formData[key] === 'string' ||
                            typeof this._request.formData[key] === 'number' ||
                            typeof this._request.formData[key] === 'boolean'
                        ) {
                            return `--${split}\r\nContent-Disposition: form-data; name=\"${key}\"\r\n\r\n${this._request.formData[key]}\r\n`;
                        }
                        else {
                            throw new Error(`not support parse ${this._request.formData[key]}`);
                        }

                    }).join();
                    text = `${content}--${split}--\r\n`;
                }
                else {
                    text = Object.keys(this._request.formData)
                        .map(key => `${key}=${this._request.formData[key]}`)
                        .join('&');
                }
            }
            else {
                text = Buffer.isBuffer(this._request.body) ? 
                    this._request.body.toString('base64') : this._request.body;
            }

            request.postData = {
                mimeType: this._request.headers["content-type"],
                text: text
            };
        }

        return request;
    }

    _httpInfoResponse() {
        let response = {
            status: this._status,
            statusText: this._statusMessage,
            httpVersion: this._httpVersion,
            cookies: [],
            headers: [],
            content: undefined
        };

        if (this._headers != undefined) {
            for (let key in this._headers) {
                if (Array.isArray(this._headers[key])) {
                    this._headers[key].forEach(item => {
                        response.headers.push({
                            name: key,
                            value: item,
                        });
                    })
                }
                else {
                    response.headers.push({
                        name: key,
                        value: this._headers[key],
                    });
                }
            }
        }

        if (this._headers['set-cookie'] != undefined || this._headers['Set-Cookie'] != undefined) {
            let cookies = this._headers['set-cookie'] || this._headers['Set-Cookie'];
            for (let cookie of cookies) {
                let standard = cookie.split(';').reduce((object, item) => {
                    let key = item.substr(0, item.indexOf('=')).trim();
                    let value = item.substr(item.indexOf('=') + 1);
                    switch (key) {
                        case 'path':
                        case 'domain':
                        case 'expires':
                            object[key] = value;
                            break;
                        case 'secure':
                        case 'httpOnly':
                            object[key] = true;
                            break;
                        case 'max-age':
                            break;
                        default:
                            object['name'] = key;
                            object['value'] = value;
                            break;
                    }
                    return object;
                }, {})
                response.cookies.push(standard);
            }
        }
        
        let content = undefined;
        switch(
            (this._headers['Content-Type'] || this._headers['content-type'] || "").split(';')[0].trim()
        ) {
            case Constant.ContentType.JSON:
            case Constant.ContentType.XML: 
            case Constant.ContentType.TEXT:
                content = this._body.toString();
                break;
            default:
                content = this._body.toString('base64');
                break;
        }

        response.content = content;
        return response;
    }

    _getContentType(filename) {
        return mime.lookup(filename) || 'application/octet-stream';
    }
}