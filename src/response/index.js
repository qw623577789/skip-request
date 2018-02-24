const should = require('should');
const fs = require('fs');

module.exports = class {
    constructor({status, body}) {
        this._status = status;
        this._body = body;
    }

    get status() {
        return this._status
    }

    toJson() {
        return JSON.parse(this._body);
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
}