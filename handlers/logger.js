/* eslint-disable-next-line import/no-extraneous-dependencies */
const logger = require('koa-logger');

const handler = app => app.use(logger());
exports.init = handler;
