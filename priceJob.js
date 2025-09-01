const cron = require('node-cron');
const { fetchHistoricalPrices, fetchCurrentPrices } = require('./fetcher');
const { initPriceTable, storePrices } = require('./storage');
require('dotenv').config();

const COINS = [
  'btc',
  'ltc',
  'eth',
  'doge',
  'aave',
  'shib',
  'xrp',
]

  const { Pool } = require('pg');
  const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function isAlreadyInitialized(symbol) {
  const res = await pool.query(
    `SELECT COUNT(*) FROM prices WHERE symbol = $1 AND timestamp < NOW() - INTERVAL '300 days'`,
    [symbol]
  );
  return parseInt(res.rows[0].count) > 0;
}

async function initializeDatabase() {
  console.log('🔧 Initializing database...');
  await initPriceTable();

  for (const symbol of COINS) {
    const alreadyInit = await isAlreadyInitialized(symbol);
    if (alreadyInit) {
      console.log(`⚠️  Skipping ${symbol}, already initialized.`);
      continue;
    }

    console.log(`📥 Fetching 1-year data for ${symbol}...`);
    const data = await fetchHistoricalPrices(symbol);
    await storePrices(symbol, data);
    console.log(`✅ Stored ${data.length} entries for ${symbol}`);
  }

  console.log('✅ Database initialization check complete.\n');
}

async function updateCurrentPrices() {
  const priceEntries = await fetchCurrentPrices(COINS);

  for (const entry of priceEntries) {
    await storePrices(entry.symbol, [entry]);
    console.log(`⏱️ Stored current price for ${entry.symbol}`);
  }
}

(async () => {
  await initializeDatabase();

  cron.schedule('* * * * *', async () => {
    console.log(`\n🔁 Fetching live prices at ${new Date().toISOString()}...`);
    await updateCurrentPrices();
  });
})();
