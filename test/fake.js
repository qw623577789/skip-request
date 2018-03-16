const assert = require("assert");
const uuid = require('uuid');
const request = require('../index.js');

suite('fake mode', () => {
    let server = null;
    suiteSetup(()=> {
        process.argv.push('fake');
        require('./common/mode/fake/handler.js');
    })
    suiteTeardown(() => {
        process.argv.splice(process.argv.indexOf('fake'), 1);
    })

    suite('#get', () => {
        test('should return status = 200', async function() {
            let response = await request.get.url("http://127.0.0.1:7777/request.info").timeout(2000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            assert(response.status === 200);
        });
        
        test('timeout,should throw error', async function() {
            this.timeout(5000);
            try {
                let response = await request.get.url("http://127.0.0.1:7777/request.timeout").timeout(1000).submit();
                const fs = require('fs');
                fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
                assert(false, 'failed');
            }
            catch (error) {
                assert(true, 'failed');
            }
        });
        
        test('get a picture and to Buffer, should success', async function() {
            this.timeout(25000);
            let response = await request.get.url("http://127.0.0.1:7777/file.get").timeout(25000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let imageBuffer = response.toBuffer();
            assert(imageBuffer instanceof Buffer && imageBuffer.length > 0, 'failed');
        });

        test('get a picture and to file, should success', async function() {
            this.timeout(25000);
            let response = await request.get.url("http://127.0.0.1:7777/file.get").timeout(25000).submit();
            let imageFile = response.toFile(`/tmp/${Date.now()}.jpg`);
            const fs = require('fs'); 
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            assert(fs.existsSync(imageFile), 'failed');
        });

        test('query params, should success', async function() {
            let response = await request.get.url("http://127.0.0.1:7777/request.info").query({
                aa: 1,
                bb: 2
            }).timeout(25000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let responseInfo = response.toJson();
            assert(responseInfo.query != undefined && responseInfo.query.aa == 1 && responseInfo.query.bb == 2, 'failed');
        });

        test('cookies, should success', async function() {
            let response = await request.get.url("http://127.0.0.1:7777/request.info").cookie('http://127.0.0.1:7777', {
                aa: 1,
                bb: 2
            }).timeout(25000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let responseInfo = response.toJson();
            assert(responseInfo.cookies != undefined && responseInfo.cookies.aa == 1 && responseInfo.cookies.bb == 2, 'failed');
        });

        test('headers, should success', async function() {
            let response = await request.get.url("http://127.0.0.1:7777/request.info").header({
                aa: 1,
                bb: 2
            }).timeout(25000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let responseInfo = response.toJson();
            assert(responseInfo.headers != undefined && responseInfo.headers.aa == 1 && responseInfo.headers.bb == 2, 'failed');
        });

        test('proxy, should success', async function() {
            this.timeout(25000);
            let response = await request.get.url("http://www.baidu.com").proxy('127.0.0.1', 1080).timeout(25000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let responseInfo = response.toString();
            assert(responseInfo != undefined, 'failed');
        });
    });

    suite('#post', () => {
        test('form, should success', async function() {
            this.timeout(25000);
            let response = await request.post.form({
                aa: 1,
                bb: 2
            }).url("http://127.0.0.1:7777/request.info").timeout(25000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let responseInfo = response.toJson();
            assert(
                responseInfo.headers['content-type'] == 'application/x-www-form-urlencoded' &&
                responseInfo.body.aa == 1 && 
                responseInfo.body.bb == 2, 'failed');
        });

        test('json, should success', async function() {
            this.timeout(25000);
            let response = await request.post.json({
                aa: 1,
                bb: 2
            }).url("http://127.0.0.1:7777/request.info").timeout(25000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let responseInfo = response.toJson();
            assert(
                responseInfo.headers['content-type'] == 'application/json' &&
                responseInfo.body.aa == 1 && 
                responseInfo.body.bb == 2, 'failed');
        });

        test('xml, should success', async function() {
            this.timeout(25000);
            let response = await request.post.xml('<xml><appid><![CDATA[aaa]]></appid></xml>').url("http://127.0.0.1:7777/request.info").timeout(25000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let responseInfo = response.toJson();
            assert(responseInfo.headers['content-type'] == 'text/xml', 'failed');
        });

        test('text, should success', async function() {
            this.timeout(25000);
            let response = await request.post.text('test').url("http://127.0.0.1:7777/request.info").timeout(25000).submit();
            const fs = require('fs');
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let responseInfo = response.toJson();
            assert(responseInfo.headers['content-type'] == 'text/plain', 'failed');
        });

        test('mutilForm, should success', async function() {
            this.timeout(25000);
            const fs = require('fs');
            let response = await request.post.mutilForm({
                field: "1",
                file: fs.createReadStream(__dirname + '/common/static/pic.jpg')
            }).url("http://127.0.0.1:7777/file.upload").timeout(25000).submit();
            fs.writeFileSync('/tmp/test/' + uuid() + ".har", JSON.stringify(response.har, null, 4))
            let responseInfo = response.toJson();

            let md5 = require('md5');
            assert(
                responseInfo.headers['content-type'].indexOf('multipart/form-data') != -1 &&
                responseInfo.body.field == '1',
                responseInfo.md5 == md5(fs.readFileSync(__dirname + '/common/static/pic.jpg'))
                , 'failed');
        });
    })
})
