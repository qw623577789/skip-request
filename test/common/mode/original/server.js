const Express = require('express');
const cors = require('cors');
const cookie = require('cookie-parser');
const bodyParser = require('body-parser');
const xmlBodyParser = require('express-xml-bodyparser');

let app = Express();
app.use(cors());
app.use(cookie());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(xmlBodyParser())
require('./handler')(app);
app.listen(7777, '127.0.0.1');