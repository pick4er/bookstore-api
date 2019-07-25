const passport = require('../passport');

const db = require('../db');
const derive_message = require('../db/messages');
const {
  create_user,
  get_user_fields,
  generate_hash,
} = require('../db/models/user');

// Though it is a dirty hack
// still acceptable for some time.
// Refactor, if you know how to.
const UNDEFINED_BILLING_ID = 0;

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

    if (user) {
      ctx.login(user);
      ctx.status = 200;
      ctx.body = JSON.stringify({
        ...flash,
        user: get_user_fields(user),
      });
    } else {
      ctx.status = 401;
      ctx.body = JSON.stringify(flash);
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

function is_admin(ctx, next) {
  if (ctx.state.user.login !== 'pick4er') {
    ctx.status = 401;
    ctx.body = 'Not allowed';

    return;
  }

  return next();
}

function get_user(ctx, next) {
  ctx.body = JSON.stringify({
    status: 'ok',
    user: get_user_fields(ctx.state.user),
  });
  ctx.status = 200;
}

async function change_user(ctx, next) {
  const {
    // profile fields
    user_id,
    email = '',
    login = '',
    password = '',
    // billing fields
    billing_id = UNDEFINED_BILLING_ID,
    first_name = '',
    last_name = '',
    middle_name = '',
    phone = '',
    shipping_address = '',
  } = ctx.request.body;

  const {
    salt,
    user_id: authed_user_id,
  } = ctx.state.user;
  let { hash } = ctx.state.user;

  if (authed_user_id !== user_id) {
    ctx.status = 401;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Нельзя редактировать другого пользователя',
    });

    return;
  }

  if (password) {
    hash = await generate_hash(salt, password);
  }

  let is_error = false;
  await db.raw(
    `CALL bookstore.change_user(\
      ${user_id}::integer,\
      '${email}'::text,\ 
      '${hash}'::text,\ 
      '${salt}'::text,\
      NULLIF('${login}', ''),\
      NULLIF(${billing_id}, 0),\ 
      NULLIF('${first_name}', ''),\ 
      NULLIF('${last_name}', ''),\
      NULLIF('${middle_name}', ''),\ 
      NULLIF('${phone}', ''),\ 
      NULLIF('${shipping_address}', '')\
    )`,
  ).catch(e => {
    is_error = true;
    console.error(e);
    ctx.status = 400;
    ctx.body = JSON.stringify({ ...derive_message(e) });
  });
  if (is_error) return;

  const response = await db.raw(
    `SELECT * FROM bookstore.get_user_by(\
      'user_id'::text,\
      ${user_id}::integer\
    )`,
  ).catch(e => {
    is_error = true;
    console.error(e);
    ctx.status = 400;
    ctx.body = JSON.stringify({ ...derive_message(e) });
  });
  if (is_error) return;

  const user = response.rows[0];
  ctx.status = 200;
  ctx.body = JSON.stringify({
    status: 'ok',
    message: 'Patched!',
    user: get_user_fields(user),
  });
}

module.exports = router => {
  router
    .post('/login', login)
    .post('/logout', is_authenticated, logout)
    .post('/register', register)
    .patch('/user', is_authenticated, change_user)
    .get('/is_authenticated', is_authenticated, get_user)
    .get('/authors', is_authenticated, is_admin, get_authors)
    .post('/add_author', is_authenticated, is_admin, add_author)
    .get('/books', get_books)
    .post('/add_book', is_authenticated, is_admin, add_book)
    .all('*', get_all);
};
