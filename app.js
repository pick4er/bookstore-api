const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

app.keys = ['secret bengal cat'];

require('./handlers/logger').init(app);
require('./handlers/errors').init(app);
require('./handlers/headers').init(app);
require('./handlers/bodyParser').init(app);
require('./handlers/session').init(app);
require('./handlers/passport').init(app);
require('./handlers/flash').init(app);
require('./routes')(router);

app.use(router.routes());

module.exports = app;
