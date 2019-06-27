const knex = require('../knexfile');

module.exports = router => {
  router
    .get('/authors', async ctx => {
      const result = await knex
        .select()
        .from('bookstore.authors');

      ctx.set({
        'Access-Control-Allow-Origin': '*',
      });
      ctx.body = JSON.stringify(result);
      ctx.status = 200;
    })
    .get('/books', async ctx => {
      const result = await knex
        .select()
        .from('bookstore.books');

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
