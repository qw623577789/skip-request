const should = require('should');
const fs = require('fs');
const Base = require('../base');

module.exports = class extends Base{
    constructor() {
        super();
        this._method = "post";
        this._body = null;
        this._formData = null;
    }

    form(form) {
        should(this._body).be.null();
        should(form).be.Object();
        this._contentType = this._ContentType.FORM;
        let params = [];
        for (let key in form) {
            params.push(`${key}=${form[key]}`);
        }
        this._body = params.join('&');
        return this;
    }

    mutilForm(form) {
        should(this._body).be.null();
        should(form).be.Object();
        this._contentType = this._ContentType.MUTIL_FORM;
        this._formData = form;
        return this;
    }

    json(json) {
        should(this._body).be.null();
        should(json).be.Object();
        this._contentType = this._ContentType.JSON;
        this._body = JSON.stringify(json);
        return this;
    }

    xml(xml) {
        should(this._body).be.null();
        should(xml).be.String();
        this._contentType = this._ContentType.XML;
        this._body = xml;
        return this;
    }

    text(text) {
        should(this._body).be.null();
        should(text).be.String();
        this._contentType = this._ContentType.TEXT;
        this._body = text;
        return this;
    }
}