const should = require('should');
const Response = require('../../response');
const process = require('process');
const moment = require('moment');
const fs = require('fs');
const Constant = require('../../common/constant');

module.exports = class{
    constructor() {
        this._request = {
            timeout: 30000,
            headers: {
                'content-type': Constant.ContentType.TEXT
            },
            agentOptions: {}
        };
    }

    url(url) {
        should(url).be.String();
        this._request.url = url;
        return this;
    }

	header(headers) {
        should(headers).be.Object();
		this._request.headers = Object.assign(this._request.headers, headers);
		return this;
    }
    
    cookie(url, cookies) {
        should(url).be.String();
        should(cookies).be.Object();
		this._request.cookies = {
            content: cookies,
            url: url
        }
		return this;
    }
    
    proxy(host, port) {
        should(host).be.String();
        should(port).be.within(1025, 65535);
        this._request.strictSSL = false;
        this._request.tunnel = true;
        this._request.agentOptions = Object.assign(this._request.agentOptions, {
            socksHost: host,
            socksPort: port
        });
		return this;
    }

    ca({certFilePath = undefined, keyFilePath = undefined, pfxFilePath = undefined}, passphrase) {
        if (pfxFilePath != undefined) {
            this._request.agentOptions = {
                pfx: fs.readFileSync(pfxFilePath),
                passphrase
            }
        }
        else {
            this._request.agentOptions = {
                cert: fs.readFileSync(certFilePath),
                key: fs.readFileSync(certFilePath),
                passphrase
            }
        }

		return this;
    }

    timeout(microSecond) {
        should(microSecond).be.Number();
        should(microSecond).be.equal(parseInt(microSecond));
        this._request.timeout = microSecond;
        return this;
    }

    query(query) {
		should(query).be.Object();
		this._request.qs = query;
		return this;
    }

    async submit() {
        if (
            this._request.agentOptions.socksHost !== undefined && 
            this._request.agentOptions.socksPort !== undefined
        ) {
            this._request.agentClass = this._request.url.substr(0, 5) == 'https' ?  require('socks5-https-client/lib/Agent') : require('socks5-http-client/lib/Agent') 
        }

        this._request.time = moment();
        let result = null;
        if (process.argv.includes('fake')) {
            result = await require('../../common/lib/fake/request')(this._request);
        }
        else {
            result = await require('../../common/lib/original/request')(this._request);
        }

        return new Response(result);
    }
}