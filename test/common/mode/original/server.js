const Express = require('express');
const cors = require('cors');
const cookie = require('cookie-parser');
const bodyParser = require('body-parser');
const xmlBodyParser = require('express-xml-bodyparser');

let app = Express();


app.use(cors());
app.use(cookie());

app.use('/gbk.request.info', (req, res, next) => {
    let reqData = [];
    let size = 0;
    req.on('data', (data) => {
        reqData.push(data);
        size += data.length;
    });
    req.on('end', () => {
        req.raw = Buffer.concat(reqData, size);
    });
    next();
});

app.use(bodyParser.text())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(xmlBodyParser())


require('./handler')(app);
app.listen(7777, '127.0.0.1');