const bodyParser = require('koa-bodyparser');

const handler = app => app.use(
  bodyParser({ jsonLimit: '56kb' }),
);
exports.init = handler;
