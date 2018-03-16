const should = require('should');
const Base = require('../base');

module.exports = class extends Base{
    constructor() {
        super();
        this._request.method = "get";
    }
}