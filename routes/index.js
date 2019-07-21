const db = require('../db');
const passport = require('../passport');

async function getAuthors(ctx) {
  const result = await db
    .select()
    .from('bookstore.authors_v');

  ctx.body = JSON.stringify(result);
  ctx.status = 200;
}

async function getBooks(ctx) {
  const result = await db
    .select()
    .from('bookstore.catalog_v');

  ctx.body = JSON.stringify(result);
  ctx.status = 200;
}

function getAll(ctx) {
  ctx.body = 'ok';
  ctx.status = 200;
}

async function addAuthor(ctx) {
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

async function addBook(ctx) {
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
    ctx.body = JSON.stringify(flash);

    if (err) {
      return next(err);
    }

    if (user) {
      ctx.login(user);
    }

    return next();
  })(ctx, next);
}

function isAuthenticated(ctx, next) {
  if (ctx.isAuthenticated()) {
    return next();
  } else {
    ctx.status = 401;
    ctx.body = 'Unauthorized';
    return;
  }
}

module.exports = router => {
  router
    .post('/login', login)
    .get('/authors', isAuthenticated, getAuthors)
    .post('/add_author', isAuthenticated, addAuthor)
    .get('/books', getBooks)
    .post('/add_book', isAuthenticated, addBook)
    .all('*', getAll)
};
