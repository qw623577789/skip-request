const Base = require('../base');
const Constant = require('../../common/constant');
const xml2js = require('xml2js');

module.exports = class extends Base{
    constructor() {
        super();
        this._request.method = "put";
    }

    form(form) {
        this._request.headers["content-type"] = Constant.ContentType.FORM;
        let params = [];
        for (let key in form) {
            params.push(`${key}=${encodeURIComponent(form[key])}`);
        }
        this._request.body = params.join('&');
        return this;
    }

    mutilForm(form) {
        this._request.headers["content-type"] = Constant.ContentType.MUTIL_FORM;
        // let formData = new FormData();
        // for (let key in formData) {
        //     formData.
        // }
        this._request.formData = form;
        return this;
    }

    json(json) {
        if (!['object', 'number', 'boolean', 'string', 'array'].includes(typeof json)) throw new Error(`${json} is not json`);
        this._request.headers["content-type"] = Constant.ContentType.JSON;
        this._request.body = JSON.stringify(json);
        return this;
    }

    xml(xml) {
        this._request.headers["content-type"] = Constant.ContentType.XML;
        this._request.body = xml;
        return this;
    }

    jsonToXml(json, xml2jsLibParams = {}) {
        const xmlBuilder = new xml2js.Builder(xml2jsLibParams);
        let xml = xmlBuilder.buildObject(json);
        this.xml(xml);
        return this;
    }

    text(text) {
        this._request.headers["content-type"] = Constant.ContentType.TEXT;
        this._request.body = text;
        return this;
    }

    buffer(contentType, buffer) {
        this._request.headers["content-type"] = contentType;
        this._request.body = buffer;
        return this;
    }
}