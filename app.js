const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

require('./handlers/logger').init(app);
require('./handlers/errors').init(app);
require('./routes')(router);

app.use(router.routes());

module.exports = app;
