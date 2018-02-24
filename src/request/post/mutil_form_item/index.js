const should = require("should");
const fs = require("fs");
const path = require('path');

module.exports = class {

    static Field(value) {
        should(value).be.String();
        return {
            type: "field",
            content: value
        }
    }

    static Buffer(buffer) {
        should(buffer).be.type('buffer');
        return {
            type: "buffer",
            content: buffer
        }
    }

    static File(filepath) {
        should(filepath).be.String();
        return {
            type: "file",
            content: fs.createReadStream(filepath)
        }
    }

    static Array(items) {
        should(items).be.Array();
        let check  = items.every((item) => item.type != undefined && ['field', 'buffer', 'file'].indexOf(item.type) != false);
        should(check).be.assert();
        return {
            type: "array", 
            content: items.map(item => item.content)
        }
    }
}