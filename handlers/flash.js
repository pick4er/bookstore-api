
exports.init = app => app.use(function(ctx, next) {
  ctx.flash = (type, html) => {
    if (!ctx.session.messages) {
      ctx.session.messages = {}
    }

    if (!ctx.session.messages[type]) {
      ctx.session.messages[type] = []
    }

    ctx.session.messages[type].push(html)
  }

  return next();
})
