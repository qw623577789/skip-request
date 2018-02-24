const should = require('should');
const Response = require('../../response');
const process = require('process');


module.exports = class {
    constructor() {
        this._url = undefined;
        this._headers = {};
        this._cookies = null;
        this._proxy = null;
        this._query = null;
        this._timeout = 30000;
        this._ContentType = {
            MUTIL_FORM:  'multipart/form-data',
            FORM: 'application/x-www-form-urlencoded',
            JSON: 'application/json',
            XML: 'text/xml',
            TEXT: 'text/plain'
        }
        this._contentType = this._ContentType.TEXT;
    }

    url(url) {
        should(url).be.String();
        this._url = url;
        return this;
    }

	header(headers) {
        should(headers).be.Object();
		this._headers = Object.assign(this._headers, headers);
		return this;
    }
    
    cookie(url, cookies) {
        should(url).be.String();
        should(cookies).be.Object();
		this._cookies = {
            content: cookies,
            url: url
        }
		return this;
    }
    
    proxy(host, port) {
        should(host).be.String();
        should(port).be.within(1025, 65535);
		this._proxy = {host, port};
		return this;
    }

    timeout(microSecond) {
        should(microSecond).be.Number();
        should(microSecond).be.equal(parseInt(microSecond));
        this._timeout = microSecond;
        return this;
    }

    query(query) {
		should(query).be.Object();
		this._query = query;
		return this;
    }

    async submit() {
        let options = {
            url: this._url,
            qs: typeof this._query === "object" ? this._query : null,
            timeout: this._timeout,
            method: this._method,
            headers: Object.assign(this._headers, {
                'content-type': this._contentType
            }),
            body: this._body,
            formData: this._formData,
            cookies: this._cookies
        }

        if (this._proxy !== null) {
            options.agentClass = this._url.substr(0, 5) == 'https' ?  require('socks5-https-client/lib/Agent') : require('socks5-http-client/lib/Agent') 
            options.strictSSL = false;
            options.tunnel = true;
            options.agentOptions = {
                socksHost: this._proxy.host,
                socksPort: this._proxy.port
            }
        }

        let result = null;
        if (process.argv.includes('fake')) {
            result = await require('../../lib/fake/request')(options);
        }
        else {
            result = await require('../../lib/original/request')(options);
        }

        return new Response(result);
    }
}