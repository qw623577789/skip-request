const Response = require('../../response');
const process = require('process');
const moment = require('moment');
const fs = require('fs');
const Constant = require('../../common/constant');
const originalCore = require('../../common/lib/original/request');
const fakeCore = require('../../common/lib/fake/request');
const iconv = require('iconv-lite');
const urlParser = require('url');

module.exports = class {
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
        return this;
    }

    url(url) {
        const urlInfo = urlParser.parse(url);
        this._request.uri = {
            ...this._request.uri,
            protocol: urlInfo.protocol,
            hostname: urlInfo.hostname,
            pathname: urlInfo.pathname,
            search: urlInfo.search,
            port: urlInfo.port || (urlInfo.protocol === "https:" ? 443 : 80)
        };
        // 修复request库在某些情况强制校验请求头里的host
        this._request.headers.host = urlInfo.hostname;

        //修复没有指明proxy代理但环境变量下有代理情况下，ip地址访问为undefined
        this._request.uri.host = `${this._request.uri.hostname}:${this._request.uri.port}`;

        return this;
    }

    followRedirect(followRedirect = true) {
        if (followRedirect) {
            this._request.jar = true;
            this.header({ host: this._request.uri.hostname });
            this._request.followAllRedirects = true;
        }
        else {
            this._request.followAllRedirects = false;
        }
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
        this._request.proxy = `http://${host}:${port}`;
        return this;
    }

    ignoreHttpsCa() {
        this._request.strictSSL = false;
        return this;
    }

    ca({ certFilePath = undefined, keyFilePath = undefined, pfxFilePath = undefined }, passphrase) {
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