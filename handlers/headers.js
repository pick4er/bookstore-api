
const middleware = async (ctx, next) => {
  ctx.set({
    'Access-Control-Allow-Origin': process.env.FRONT_URL,
    'Access-Control-Allow-Methods':
      'GET, POST, PATCH, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  });

  await next();
};

const handler = app => app.use(middleware);
exports.init = handler;
