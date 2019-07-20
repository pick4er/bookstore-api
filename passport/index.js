const passport = require('koa-passport');

const localStrategy = require('./strategies/local');

passport.serializeUser(function(user, done) {
  done(null, user.login);
});

passport.deserializeUser(function(id, done) {
  console.log('deserialize user with id: ', id);
});

passport.use(localStrategy);

module.exports = passport;
