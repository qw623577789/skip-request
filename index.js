let GetRequest = require('./src/request/get');
let PostRequest = require('./src/request/post');
let PutRequest = require('./src/request/put');
let DeleteRequest = require('./src/request/delete');
let FakeResponse = require('./src/common/lib/fake/response');

module.exports =  class {
    static get get() {
        return new GetRequest();
    }

    static get post() {
        return new PostRequest();
    }

    static get delete() {
        return new DeleteRequest();
    }

    static get put() {
        return new PutRequest();
    }

    static get fake() {
        return new FakeResponse();
    }
}