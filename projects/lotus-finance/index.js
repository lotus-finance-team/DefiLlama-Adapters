const { get } = require('../helper/http');

const LOTUS_API_BASE = process.env.LOTUS_API_BASE ?? "https://lotus-api.lotusfinance.xyz";
const LOTUS_PATH = "/contract/performance";
const INTERVAL = "1d";

async function tvl(api) {
  const timestamp = api.timestamp;
  
  // Fetch data from Lotus API
  const qs = new URLSearchParams({
    startTime: String((timestamp - 86400) * 1000), // 24 hours before
    endTime: String(timestamp * 1000),
    interval: INTERVAL,
  }).toString();

  const data = await get(`${LOTUS_API_BASE}${LOTUS_PATH}?${qs}`);

  // Find the most recent TVL data point
  let latestTvl = 0;
  
  for (const row of data) {
    if (!Array.isArray(row) || row.length < 5) continue;

    const [timeMs, totalValueLocked, tradingVolumeUsd, activeVaultCount, totalVaultCount] = row;
    const ts = Number(timeMs) / 1000;
    
    // Get the TVL for the requested timestamp (or closest to it)
    if (ts >= timestamp - 86400 && ts <= timestamp) {
      latestTvl = Number(totalValueLocked);
    }
  }

  // Add TVL in USD
  if (latestTvl > 0) {
    api.addUSDValue(latestTvl);
  }

  return api.getBalances();
}

module.exports = {
  methodology: 'TVL is calculated by summing the total value locked across all Lotus Finance vaults on Sui. Data is fetched from the Lotus Finance API.',
  timetravel: true, // Set to false if the API doesn't support historical data
  misrepresentedTokens: true, // Set if the API returns USD values directly
  sui: {
    tvl,
  },
  start: '2025-06-28',
};
