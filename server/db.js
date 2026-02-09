require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});
// Database connection error handling
pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
  process.exit(-1);
});
// Test the database connection
pool.connect()
  .then(() => console.log('Connected to the database'))
  .catch((err) => console.error('Database connection error', err.stack));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};