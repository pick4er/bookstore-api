const passport = require('koa-passport');

exports.init = app => {
  // ctx.isAuthenticate, ctx.login, ctx.logout
  app.use(passport.initialize());
  // ctx.state.user
  app.use(passport.session());
}
