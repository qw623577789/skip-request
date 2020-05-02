const Base = require('../base');

module.exports = class extends Base{
    constructor() {
        super();
        this._request.method = "get";
    }
}