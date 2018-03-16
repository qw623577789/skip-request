const should = require('should');
const xml2js = require('xml2js-parser').parseStringSync;
const moment = require('moment');
const Har = require('har');
const fs = require('fs');
const url = require('url');
const Stream = require('stream');
const path = require('path');

module.exports = class {
    constructor({request, response:{status, statusMessage, headers, httpVersion, body}}) {
        this._request = request;
        this._status = status;
        this._statusMessage = statusMessage;
        this._headers = headers;
        this._httpVersion = httpVersion;
        this._body = body;
        this._time = moment();
    }
    
    get status() {
        return this._status
    }

    get headers() {
        return this._headers;
    }

    get har() {
        let har = new Har.Log({
            version: 1.2,
            creator: new Har.Creator({
                name: 'skip-requester',
                version: '1.0.0'
            })
        });

        let entry = new Har.Entry({
            startedDateTime: this._request.time.format(),
            time: this._time.diff(this._request.time),
            request: this._harRequest(),
            response: this._harResponse()
        });
        //if (this._request.method !== "post") delete entry.postData;
        har.addEntry(entry);

        return {
            log: {
                creator: har.creator,
                entries: har.entries.map(item => {
                    return {
                        cache: item.cache,
                        request: item.request,
                        response: item.response,
                        startedDateTime: item.startedDateTime,
                        time: item.time,
                        timings: item.timings
                    }
                }),
                version: har.version
            }
        };
    }

    toJson() {
        let jsonObject = this._tryParseJsonTextToJson(this._body.toString()) || this._tryParseXmlTextToJson(this._body.toString());
        should(jsonObject).be.Object();
        return jsonObject;
    }

    toString() {
        return this._body.toString();
    }

    toBuffer() {
        return new Buffer(this._body);
    }

    toFile(filePath) {
        should(this._body).be.not.null();
        fs.writeFileSync(filePath, this._body);
        return filePath;
    }

    _tryParseJsonTextToJson(text) {
        try {
            let object = JSON.parse(text);
            if (typeof object !== 'object') return false;
            return object;
        }
        catch(error) {
            return false;
        }
    }

    _tryParseXmlTextToJson(text) {
        try {
            return xml2js(text, { explicitArray: false, ignoreAttrs: true});
        }
        catch (error) {
            return false;
        }
    }

    _harRequest() {
        let request = new Har.Request({
            url: this._request.url + (this._request.qs == undefined ? '' : "?" + Object.keys(this._request.qs).map(key => `${key}=${this._request.qs[key]}`).join('&')),
            method: this._request.method
        });

        if (this._request.qs != undefined) {
            for (let key in this._request.qs) {
                let query = new Har.Query(key, this._request.qs[key], '');
                request.addQuery(query);
            }
        }

        if (this._request.cookies != undefined) {
            let {host, pathname} = url.parse(this._request.url);
            for (let key in this._request.cookies.content) {
                let cookie = new Har.Cookie({
                    name: key,
                    value: this._request.cookies.content[key],
                    path: pathname,
                    domain: host
                });
                request.addCookie(cookie);
            }
            
            let key = 'cookie';
            let value = Object.keys(this._request.cookies.content).map(key => `${key}=${this._request.cookies.content[key]}`).join(';');
            let header = new Har.Header({name: key, value: value});
            request.addHeader(header);
        }

        if (this._request.headers != undefined) {
            for (let key in this._request.headers) {
                let header = new Har.Header({
                    name: key,
                    value: this._request.headers[key],
                });
                request.addHeader(header);
            }
        }

        if (this._request.method == "post") {
            let text = undefined;
            if (this._request.formData != undefined) {
                if (this._request.headers["content-type"].indexOf('boundary=') != -1) {
                    let sqlit = this._request.headers["content-type"].split('boundary=')[1];
                    let content = Object.keys(this._request.formData).map(key => {
                        if (this._request.formData[key] instanceof Stream) {
                            let filename = path.basename(this._request.formData[key].path);
                            let contentType = _getContentType(filename);
                            return `--${sqlit}\r\nContent-Disposition: form-data; name=\"${key}\";filename=\"${filename}\"\r\nContent-Type:${contentType}\r\n\r\n...\r\n`;
                        }
                        else if(this._request.formData[key] instanceof String || 
                         this._request.formData[key] instanceof Number) {
                            return `--${sqlit}\r\nContent-Disposition: form-data; name=\"${key}\"\r\n\r\n${this._request.formData[key]}\r\n`;
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
                text = this._request.body;
            }

            request.postData = new Har.PostData({
                mimeType: this._request.headers["content-type"] ,
                text: text
            });
        }

        return request;
    }

    _harResponse() {
        let response = new Har.Response({
            status: this._status,
            statusText: this._statusMessage,
            httpVersion: this._httpVersion
        });

        if (this._headers != undefined) {
            for (let key in this._headers) {
                if (Array.isArray(this._headers[key])) {
                    this._headers[key].forEach(item => {
                        let header = new Har.Header({
                            name: key,
                            value: item,
                        });
                        response.addHeader(header);
                    })
                }
                else {
                    let header = new Har.Header({
                        name: key,
                        value: this._headers[key],
                    });
                    response.addHeader(header);
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
                response.addCookie(new Har.Cookie(standard));
            }
        }

        let isString = Buffer.compare(new Buffer(this._body.toString()), this._body) === 0;
        let content  = new Har.Content({
            mimeType: this._headers['content-type'],
            text: isString == false ? this._body.toString('base64') : this._body.toString(),
            encoding: isString == false ? 'base64' : undefined
        });
        response.content = content;
        return response;
    }

    _getContentType(filename) {
        let mime = require('mime-types')
        return mime.lookup(filename) || 'application/octet-stream';
    }
}