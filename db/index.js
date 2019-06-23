const { Pool } = require('pg');

const connectionString = `${process.env.DATABASE_URL}\
?ssl=true`;

function getConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString };
  }

  return {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: true,
  };
}

const pool = new Pool(getConfig());

module.exports = {
  query: (text, params, callback) => (
    pool.query(text, params, callback)
  ),
};
