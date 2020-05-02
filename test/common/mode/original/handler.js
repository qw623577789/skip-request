const multer = require('multer');
const md5 = require("md5");
const storage = multer.memoryStorage();
const upload = multer({storage: storage});
const iconv = require('iconv-lite');

module.exports = (router)=>{
    router.all('/request.info', (request, response) => {
        response.json({
            url: request.url,
            method: request.method,
            query: request.query,
            cookies: request.cookies,
            headers: request.headers,
            body: request.body
        })
    });

    router.post('/file.upload', upload.single('file'), (request, response) => {
        response.json({
            url: request.url,
            method: request.method,
            query: request.query,
            cookies: request.cookies,
            headers: request.headers,
            md5: md5(request.file.buffer),
            body: request.body
        })
    });

    router.get('/file.get', (request, response) => {
        response.sendFile(__dirname + '/static/pic.jpg')
    });

    router.get('/request.timeout', (request, response) => {
        setTimeout(() => {
            response.end("hi");
        }, 5000)
    });

    router.all('/gbk.request.info', (request, response) => {
        request.body = JSON.parse(
            iconv.decode(request.raw, 'gbk')
        );
        response.send(
            iconv.encode(
                JSON.stringify({
                    url: request.url,
                    method: request.method,
                    query: request.query,
                    cookies: request.cookies,
                    headers: request.headers,
                    body: request.body
                }),
                'gbk'
            )
        )
    });
}
