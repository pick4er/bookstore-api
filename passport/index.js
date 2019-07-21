const passport = require('koa-passport');

const localStrategy = require('./strategies/local');

passport.serializeUser(function(user, done) {
  return done(null, user.login);
});

passport.deserializeUser(function(id, done) {
  return done(null, { login: process.env.LOGIN, password: process.env.PASSWORD });
});

passport.use(localStrategy);

module.exports = passport;
