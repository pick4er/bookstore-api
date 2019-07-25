const passport = require('koa-passport');

const db = require('../db');
const local_strategy = require('./strategies/local');

passport.serializeUser((user, done) => {
  if (!user.email) {
    return done(null, false, {
      status: 'error',
      message: 'Email не найден во время сериализации',
    });
  }

  return done(null, user.email);
});

passport.deserializeUser(async (email, done) => {
  const result = await db.raw(
    `SELECT * FROM bookstore.get_user_by(\
      'email'::text,\
      '${email}'::text\
    )`,
  ).catch(console.error);

  const user = result.rows[0];

  if (!user) {
    return done(null, false, {
      status: 'error',
      message: 'Пользователь не найден',
    });
  }

  return done(null, user);
});

passport.use(local_strategy);

module.exports = passport;
