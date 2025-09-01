const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initPriceTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS prices (
      id SERIAL PRIMARY KEY,
      symbol TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      price NUMERIC,
      volume NUMERIC,
      market_cap NUMERIC,
      UNIQUE(symbol, timestamp)
    );
  `;
  await pool.query(query);
}

async function storePrices(symbol, priceData) {
  const client = await pool.connect();
  try {
    const insertQuery = `
      INSERT INTO prices (symbol, timestamp, price, volume, market_cap)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (symbol, timestamp) DO NOTHING;
    `;

    for (const row of priceData) {
      await client.query(insertQuery, [
        symbol,
        row.timestamp,
        row.price,
        row.volume,
        row.market_cap
      ]);
    }
  } catch (err) {
    console.error(`❌ Error storing prices for ${symbol}:`, err.message);
  } finally {
    client.release();
  }
}

module.exports = { initPriceTable, storePrices };
