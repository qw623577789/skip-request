let GetRequest = require('./src/request/get');
let PostRequest = require('./src/request/post');
let FakeResponse = require('./src/common/lib/fake/response');

module.exports =  class {
    static get get() {
        return new GetRequest();
    }

    static get post() {
        return new PostRequest();
    }

    static get fake() {
        return new FakeResponse();
    }
}