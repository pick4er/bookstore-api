const db = require('../db');
const passport = require('../passport');

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
  passport.authenticate('local', function(err, user, flash) {
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

function is_authenticated(ctx, next) {
  if (ctx.isAuthenticated()) {
    return next();
  } else {
    ctx.status = 401;
    ctx.body = JSON.stringify({
      status: 'error',
      message: 'Unauthorized',
    });
    return;
  }
}

module.exports = router => {
  router
    .post('/login', login)
    .get('/is_authenticated', is_authenticated)
    .get('/authors', is_authenticated, get_authors)
    .post('/add_author', is_authenticated, add_author)
    .get('/books', get_books)
    .post('/add_book', is_authenticated, add_book)
    .all('*', get_all)
};
