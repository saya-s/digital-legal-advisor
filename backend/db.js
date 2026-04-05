//creating the database connection here 
//we load the db credintials from .env
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: process.env.TIDB_PORT,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true // This is required for TiDB Cloud
  },
  connectionLimit: 1
});

module.exports = pool.promise();