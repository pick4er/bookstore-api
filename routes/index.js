const db = require('../db');

module.exports = router => {
  router
    .get('/authors', async ctx => {
      const result = await db
        .select()
        .from('bookstore.authors_v');

      ctx.set({
        'Access-Control-Allow-Origin': '*',
      });
      ctx.body = JSON.stringify(result);
      ctx.status = 200;
    })
    .get('/books', async ctx => {
      const result = await db
        .select()
        .from('bookstore.catalog_v');

      ctx.set({
        'Access-Control-Allow-Origin': '*',
      });
      ctx.body = JSON.stringify(result);
      ctx.status = 200;
    })    
    .get('*', ctx => {
      ctx.body = 'ok';
      ctx.status = 200;
    });
};
