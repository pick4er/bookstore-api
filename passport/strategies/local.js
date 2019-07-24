const LocalStrategy = require('passport-local').Strategy;
const db = require('../../db');
const { is_same_user } = require('../../db/models/user');

module.exports = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  (async (email, password, done) => {
    const result = await db.raw(
      `SELECT * FROM bookstore.get_user_by(\
        'email',\
        '${email}'\
      )`,
    ).catch(e => {
      console.error(e);
      return done(e, false);
    });

    const user = result.rows[0];

    if (!user) {
      return done(null, false, {
        status: 'error',
        message: 'Нет такого пользователя',
      });
    }

    const is_password_valid = await is_same_user(
      user.password_hash,
      user.salt,
      password,
    ).catch(console.error);

    if (is_password_valid) {
      return done(null, user, {
        status: 'ok',
        message: 'Добро пожаловать',
      });
    } else {
      return done(null, false, {
        status: 'error',
        message: 'Пароль не верен',
      });
    }
  }),
);
