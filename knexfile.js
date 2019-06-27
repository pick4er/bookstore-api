const knex = require('knex');

function isDebugMode() {
  return process.env.NODE_ENV === 'development';
}

const connectionString = `${process.env.DATABASE_URL}\
?ssl=true`;

function getConnection() {
  if (process.env.DATABASE_URL) {
    return { connectionString };
  }

  return {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  };
}


module.exports = knex({
  client: 'pg',
  version: '7.11',
  connection: getConnection(),
  pool: {
    min: 0,
    max: 10,
  },
  migrations: {
    tableName: 'migrations',
  },
  debug: isDebugMode(),
});
