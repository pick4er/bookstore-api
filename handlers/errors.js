
const middleware = async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    if (e.status) {
      ctx.body = e.message;
      ctx.status = e.status;
    } else if (e.name === 'ValidationError') {
      ctx.status = 400;

      const errors = {};
      Object.keys(e.errors).forEach(key => {
        errors[key] = e.errors[key].message;
      });

      ctx.body = { ...errors };
    } else {
      ctx.body = 'Error 500';
      ctx.status = 500;
      console.error(e.message, e.stack);
    }
  }
};

const handler = app => app.use(middleware);
exports.init = handler;
