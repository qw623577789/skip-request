const Response = require('../../response');
const process = require('process');
const moment = require('moment');
const fs = require('fs');
const Constant = require('../../common/constant');
const originalCore = require('../../common/lib/original/request');
const fakeCore = require('../../common/lib/fake/request');
const httpsAgent = require('socks5-https-client/lib/Agent');
const httpAgent =  require('socks5-http-client/lib/Agent') 
const iconv = require('iconv-lite');

module.exports = class{
    constructor() {
        this._request = {
            timeout: 30000,
            headers: {
                'content-type': Constant.ContentType.TEXT
            },
            agentOptions: {},
            secureProtocol: "TLSv1_method",
            encoding: null,
            character: 'utf8'
        };
    }

    secureProtocol(secureProtocol = "TLSv1_method") {
        this._request.secureProtocol = secureProtocol;
    }

    url(url) {
        this._request.url = url;
        return this;
    }

	header(headers) {
		this._request.headers = Object.assign(this._request.headers, headers);
		return this;
    }
    
    cookie(url, cookies) {
		this._request.cookies = {
            content: cookies,
            url: url
        }
		return this;
    }
    
    auth(userName, password, sendImmediately = false, bearer = undefined) {
        this._request.auth = {
            userName, 
            password, 
            sendImmediately, 
            bearer
        }
        return this;
    }

    proxy(host, port) {
        this._request.strictSSL = false;
        this._request.tunnel = true;
        this._request.agentOptions = Object.assign(this._request.agentOptions, {
            socksHost: host,
            socksPort: port
        });
		return this;
    }

    ignoreHttpsCa() {
        this._request.strictSSL = false;
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
        this._request.timeout = microSecond;
        return this;
    }

    query(query) {
		this._request.qs = query;
		return this;
    }

    characterEncoding(character = "utf8") {
        this._request.character = character;
        return this;
    }

    async submit() {
        if (
            this._request.agentOptions.socksHost !== undefined && 
            this._request.agentOptions.socksPort !== undefined
        ) {
            this._request.agentClass = this._request.url.substr(0, 5) == 'https' ?  httpsAgent : httpAgent 
        }

        this._request.time = moment();

        if (this._request.character !== "utf8") {
            this._request.body = iconv.encode(this._request.body, this._request.character);
        }

        let result = null;
        if (process.argv.includes('fake')) {
            result = await fakeCore(this._request);
        }
        else {
            result = await originalCore(this._request);
        }

        return new Response(result);
    }
}