
const middleware = async (ctx, next) => {
  ctx.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods':
      'GET, POST, PATCH, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  await next();
};

const handler = app => app.use(middleware);
exports.init = handler;
