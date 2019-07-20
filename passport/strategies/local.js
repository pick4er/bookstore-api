const LocalStrategy = require('passport-local').Strategy;

module.exports = new LocalStrategy(
  {
    usernameField: 'login',
    passwordField: 'password',
  },
  function processLocal(login, password, done) {
    if (login === process.env.LOGIN && password === process.env.PASSWORD) {
      return done(null, { login, password }, { message: 'You are welcome' });
    } else {
      return done(null, false, { message: 'Neither login nor password provided' });
    }
  }
);