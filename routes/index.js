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

const login = passport.authenticate('local', {
  failureFlash: false,
  successFlash: false,
});

function onLoginSuccess(ctx) {
  ctx.body = 'success';
  ctx.status = 200;
}

module.exports = router => {
  router
    .get('/authors', getAuthors)
    .post('/add_author', login, addAuthor)
    .get('/books', getBooks)
    .post('/add_book', login, addBook)
    .post('/login', login, onLoginSuccess)
    .all('*', getAll);
};
