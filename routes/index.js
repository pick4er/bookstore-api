const db = require('../db');

module.exports = router => {
  router
    .get('/authors', async ctx => {
      const { rows } = await db.query(
        'SELECT * FROM bookstore.authors;', [],
      ).catch(console.error);

      ctx.body = JSON.stringify(rows);
      ctx.status = 200;
    })
    .get('*', ctx => {
      ctx.body = 'ok';
      ctx.status = 200;
    });
};
