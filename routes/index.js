const passport = require('../passport');

const db = require('../db');
const derive_message = require('../db/messages');
const create_user = require('../db/models/user').create_user;

async function get_authors(ctx) {
  const result = await db
    .select()
    .from('bookstore.authors_v');

  ctx.body = JSON.stringify(result);
  ctx.status = 200;
}

async function get_books(ctx) {
  const result = await db
    .select()
    .from('bookstore.catalog_v');

  ctx.body = JSON.stringify(result);
  ctx.status = 200;
}

function get_all(ctx) {
  ctx.body = JSON.stringify({ status: 'ok' });
  ctx.status = 200;
}

async function add_author(ctx) {
  const {
    first_name,
    middle_name,
    last_name,
  } = ctx.request.body;

  const result = await db.raw(
    `SELECT * FROM bookstore.add_author(\
      '${last_name}',\
      '${first_name}',\
      '${middle_name}'\
    )`,
  ).catch(console.error);

  ctx.status = 200;
  ctx.body = JSON.stringify({ result: 'added' });
}

async function add_book(ctx) {
  const {
    title,
    authors,
  } = ctx.request.body;

  const parsedAuthors = authors
    .map(Number)
    .filter(n => !isNaN(n));

  const result = await db.raw(
    `SELECT * FROM bookstore.add_book(\
      '${title}',\
      ARRAY[${parsedAuthors}]\
    )`,
  ).catch(console.error);

  ctx.status = 200;
  ctx.body = JSON.stringify(result);
}

function login(ctx, next) {
  return passport.authenticate('local', (err, user, flash) => {
    if (err) {
      ctx.status = 500;
      ctx.body = err;
      return;
    }

    ctx.body = JSON.stringify(flash);

    if (user) {
      ctx.login(user);
      ctx.status = 200;
    } else {
      ctx.status = 401;
    }
  })(ctx, next);
}

function logout(ctx, next) {
  ctx.logout();
  ctx.redirect('/');
}

async function register(ctx) {
  if (ctx.isAuthenticated()) {
    ctx.status = 200;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Уже авторизованы. Выйдите сначала',
    });

    return;
  }

  let is_error = false;
  const user = await create_user(ctx.request.body)
    .catch(e => {
      is_error = true;
      ctx.status = 400;
      ctx.body = JSON.stringify({
        status: 'error',
        message: e.message,
      });
    });
  if (is_error) return;

  const { email, hash, salt, login } = user;
  const result = await db.raw(
    `SELECT * FROM bookstore.add_user(\
      '${email}', '${hash}', '${salt}', NULLIF('${login}', '')\
    )`,
  ).catch(e => {
    is_error = true;
    ctx.status = 400;
    ctx.body = JSON.stringify(derive_message(e));
  });
  if (is_error) return;

  ctx.status = 200;
  ctx.body = JSON.stringify({
    status: 'ok',
    message: 'Registered successfully',
  });
}

function is_authenticated(ctx, next) {
  if (ctx.isAuthenticated()) {
    return next();
  } else {
    ctx.status = 401;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Не авторизован',
    });
  }
}

module.exports = router => {
  router
    .post('/login', login)
    .post('/logout', is_authenticated, logout)
    .post('/register', register)
    .get('/is_authenticated', is_authenticated)
    .get('/authors', is_authenticated, get_authors)
    .post('/add_author', is_authenticated, add_author)
    .get('/books', get_books)
    .post('/add_book', is_authenticated, add_book)
    .all('*', get_all);
};
