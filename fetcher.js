const axios = require('axios');

const SYMBOL_TO_ID = {
  btc: 'bitcoin',
  ltc: 'litecoin',
  eth: 'ethereum',
  doge: 'dogecoin',
  aave: 'aave',
  shib: 'shiba-inu',
  xrp: 'ripple',
//   ada: 'cardano',
//   sol: 'solana',
//   dot: 'polkadot',
//   link: 'chainlink',
//   uni: 'uniswap',
//   xlm: 'stellar',
//   trx: 'tron',
//   vet: 'vechain',
//   algo: 'algorand',
//   atom: 'cosmos',
//   xtz: 'tezos',
//   avax: 'avalanche-2',
//   near: 'near',
//   apt: 'aptos',
//   ftm: 'fantom',
};

const LOOKBACK_DAYS = 365;

async function fetchHistoricalPrices(symbol) {
  const coinId = SYMBOL_TO_ID[symbol];
  const now = Math.floor(Date.now() / 1000);
  const from = now - LOOKBACK_DAYS * 86400;

  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range`;

  try {
    const res = await axios.get(url, {
      params: {
        vs_currency: 'usd',
        from,
        to: now
      }
    });

    const prices = res.data.prices || [];
    const volumes = res.data.total_volumes || [];
    const market_caps = res.data.market_caps || [];

    return prices.map((entry, i) => ({
      timestamp: new Date(entry[0]).toISOString(),
      price: entry[1],
      volume: volumes[i]?.[1] ?? null,
      market_cap: market_caps[i]?.[1] ?? null
    }));
  } catch (err) {
    console.error(`❌ Failed to fetch ${symbol}:`, err.message);
    return [];
  }
}

async function fetchCurrentPrices(symbols) {
  const coinIds = symbols.map(symbol => SYMBOL_TO_ID[symbol]).join(',');

  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: coinIds,
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true
      }
    });

    const timestamp = new Date().toISOString();
    const prices = [];

    for (const symbol of symbols) {
      const coinId = SYMBOL_TO_ID[symbol];
      const priceData = res.data[coinId];

      if (priceData) {
        prices.push({
          symbol,
          timestamp,
          price: priceData.usd,
          volume: priceData.usd_24h_vol,
          market_cap: priceData.usd_market_cap
        });
      } else {
        console.warn(`⚠️ No data found for ${symbol} (${coinId})`);
      }
    }

    return prices;
  } catch (err) {
    console.error('❌ Failed to fetch current prices:', err.message);
    return [];
  }
}


module.exports = { fetchHistoricalPrices, fetchCurrentPrices };
