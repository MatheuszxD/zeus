import config from '../config.js';
import logger from '../utils/logger.js';
import { retry, RateLimiter } from '../utils/helpers.js';

const rateLimiter = new RateLimiter(30, 60000);

export async function getTokenData(mintAddress) {
  await rateLimiter.acquire();
  return retry(async () => {
    const response = await fetch(`${config.apis.dexScreener}/${mintAddress}`);
    if (!response.ok) throw new Error(`DexScreener error: ${response.status}`);
    const data = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;
    const pair = data.pairs[0];
    return {
      mint: mintAddress, name: pair.baseToken?.name || 'Unknown', symbol: pair.baseToken?.symbol || 'UNK',
      priceUsd: parseFloat(pair.priceUsd || 0), marketCap: pair.marketCap || pair.fdv || 0,
      liquidity: pair.liquidity?.usd || 0, priceChange24h: pair.priceChange?.h24 || 0
    };
  }, { maxAttempts: 3, baseDelay: 2000 });
}

export default { getTokenData };
