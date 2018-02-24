const md5 = require('md5');
const Fake = require('../../../../').fake;

Fake.get('http://127.0.0.1:7777/request.info', (request, response) => {
    response.json({
        url: request.url,
        method: request.method,
        query: request.query,
        cookies: request.cookies,
        headers: request.headers,
        body: request.body
    })
})

Fake.post('http://127.0.0.1:7777/request.info', (request, response) => {
    response.json({
        url: request.url,
        method: request.method,
        query: request.query,
        cookies: request.cookies,
        headers: request.headers,
        body: request.body
    })
})

Fake.post('http://127.0.0.1:7777/file.upload', (request, response) => {
    response.json({
        url: request.url,
        method: request.method,
        query: request.query,
        cookies: request.cookies,
        headers: request.headers,
        body: request.body,
        md5: md5(request.body.file)
    })
})

Fake.get('http://127.0.0.1:7777/file.get', (request, response) => {
    response.file(__dirname + '/static/pic.jpg');
})

Fake.get('http://127.0.0.1:7777/request.timeout', (request, response) => {
    setTimeout(() => {
        response.text("hi");
    }, 5000)
})

Fake.get('http://www.baidu.com', (request, response) => {
    response.text("<a>hi</a>")
})