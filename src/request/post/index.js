const should = require('should');
const fs = require('fs');
const Base = require('../base');
const Constant = require('../../common/constant');
const FormData = require('form-data');

module.exports = class extends Base{
    constructor() {
        super();
        this._request.method = "post";
    }

    form(form) {
        should(form).be.Object();
        this._request.headers["content-type"] = Constant.ContentType.FORM;
        let params = [];
        for (let key in form) {
            params.push(`${key}=${form[key]}`);
        }
        this._request.body = params.join('&');
        return this;
    }

    mutilForm(form) {
        should(form).be.Object();
        this._request.headers["content-type"] = Constant.ContentType.MUTIL_FORM;
        // let formData = new FormData();
        // for (let key in formData) {
        //     formData.
        // }
        this._request.formData = form;
        return this;
    }

    json(json) {
        should(json).be.Object();
        this._request.headers["content-type"] = Constant.ContentType.JSON;
        this._request.body = JSON.stringify(json);
        return this;
    }

    xml(xml) {
        should(xml).be.String();
        this._request.headers["content-type"] = Constant.ContentType.XML;
        this._request.body = xml;
        return this;
    }

    text(text) {
        should(text).be.String();
        this._request.headers["content-type"] = Constant.ContentType.TEXT;
        this._request.body = text;
        return this;
    }
}