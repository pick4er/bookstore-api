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
// Fork and refactor, if you know how to.
const UNDEFINED_INT = 0;

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
  ctx.body = JSON.stringify({
    status: 'ok',
    message: 'Автор добавлен',
  });
}

async function add_book(ctx) {
  const {
    title,
    price = UNDEFINED_INT,
    authors,
  } = ctx.request.body;

  const parsedAuthors = authors
    .map(Number)
    .filter(n => !isNaN(n));

  const is_error = false;
  const result = await db.raw(
    `SELECT * FROM bookstore.add_book(\
      '${title}'::text,\
      NULLIF(${price}, 0),\
      ARRAY[${parsedAuthors}]\
    )`,
  ).catch(e => {
    is_error = true;
    console.error(e);
    ctx.status = 400;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Книга не была добавлена',
    });
  });
  if (is_error) return;

  ctx.status = 200;
  ctx.body = JSON.stringify({
    status: 'ok',
    message: 'Книга добавлена',
  });
}

async function keep_book(ctx) {
  const {
    book_id,
    qty,
  } = ctx.request.body;

  let is_error = false;
  const result = await db.raw(
    `CALL bookstore.keep_book(\
      ${book_id}::integer,\
      ${qty}::integer\
    )`,
  ).catch(e => {
    is_error = true;
    console.error(e);
    ctx.status = 400;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Книги не были оприходованы. Попробуйте еще раз.',
    });
  });
  if (is_error) return;

  ctx.status = 200;
  ctx.body = JSON.stringify({
    status: 'ok',
    message: 'Книги оприходованы',
  });
}

async function update_book(ctx) {
  const {
    book_id,
    title,
    price = UNDEFINED_INT,
    qty,
    authors,
  } = ctx.request.body;

  const parsedAuthors = authors
    .map(Number)
    .filter(n => !isNaN(n));

  let is_error = false;
  const result = await db.raw(
    `CALL bookstore.update_book(\
      ${book_id}::integer,\
      '${title}'::text,\
      ARRAY[${parsedAuthors}],\
      NULLIF(${price}, 0),\
      NULLIF(${qty}, 0)
    )`,
  ).catch(e => {
    is_error = true;
    console.error(e);
    ctx.status = 400;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Книга не была обновлена. Попробуйте снова',
    });
  });
  if (is_error) return;

  ctx.status = 200;
  ctx.body = JSON.stringify({
    status: 'ok',
    message: 'Книга обновлена',
  });
}

async function update_author(ctx) {
  const {
    author_id,
    first_name,
    last_name,
    middle_name,
  } = ctx.request.body;

  let is_error = false;
  const result = await db.raw(
    `CALL bookstore.update_author(\
      ${author_id}::integer,\
      '${last_name}'::text,\
      '${first_name}'::text,\
      '${middle_name}'::text\
    )`,
  ).catch(e => {
    is_error = true;
    console.error(e);
    ctx.status = 400;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Автор не был обновлен. Попробуйте снова',
    });
  });
  if (is_error) return;

  ctx.status = 200;
  ctx.body = JSON.stringify({
    status: 'ok',
    message: 'Автор обновлен',
  });
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
    billing_id = UNDEFINED_INT,
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

async function get_cart(ctx) {
  const { user_id } = ctx.query;

  let is_error = false;
  const response = await db.raw(
    `SELECT * FROM bookstore.get_cart(\
      ${user_id}::integer\
    )`,
  ).catch(e => {
    is_error = true;
    console.error(e);
    ctx.status = 400;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Не получилось достать корзину из базы',
    });
  });
  if (is_error) return;

  const cart = response.rows;
  ctx.status = 200;
  ctx.body = JSON.stringify({
    status: 'ok',
    cart,
  });
}

async function update_cart(ctx) {
  const {
    user_id,
    book_id,
    qty,
  } = ctx.request.body;

  let is_error = false;
  const response = await db.raw(
    `CALL bookstore.update_cart(\
      ${user_id}::integer,\
      ${book_id}::integer,\
      ${qty}::integer\
    )`,
  ).catch(e => {
    is_error = true;
    console.error(e);
    ctx.status = 400;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Не удалось обновить корзину',
    });
  });
  if (is_error) return;

  ctx.status = 200;
  ctx.body = JSON.stringify({
    status: 'ok',
    message: 'Корзина обновлена',
  });
}

async function clear_user_cart(ctx, next) {
  await next();
}

async function remove_from_cart(ctx, next) {
  await next();
}

async function create_order(ctx, next) {
  const { user_id } = ctx.request.body;

  let is_error = false;
  const response = await db.raw(
    `SELECT * FROM bookstore.create_order(\
      ${user_id}::integer\
    )`,
  ).catch(e => {
    is_error = true;
    console.error(e);
    ctx.status = 400;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Не удалось создать заказ',
    });
  });
  if (is_error) return;

  const { order_id } = response.rows[0];
  ctx.status = 200;
  ctx.body = JSON.stringify({
    status: 'ok',
    message: 'Заказ создан',
    order_id,
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
    .post('/keep_book', is_authenticated, is_admin, keep_book)
    .patch('/update_book', is_authenticated, is_admin, update_book)
    .patch('/update_author', is_authenticated, is_admin, update_author)
    .get('/get_cart', is_authenticated, get_cart)
    .patch('/update_cart', is_authenticated, update_cart)
    .post('/clear_user_cart', is_authenticated, clear_user_cart)
    .post('/remove_from_cart', is_authenticated, remove_from_cart)
    .post('/create_order', is_authenticated, create_order)
    .all('*', get_all);
};
