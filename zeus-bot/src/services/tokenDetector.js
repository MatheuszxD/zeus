import config from '../config.js';
import logger from '../utils/logger.js';
import { sleep } from '../utils/helpers.js';
import { getTokenAccounts } from './helius.js';
import { getTokenInfo, getTokensByCreator } from './pumpportal.js';
import { saveToken, getActiveToken } from './supabase.js';

let isMonitoring = false;
let detectedToken = null;

export async function startTokenDetection(walletAddress, options = {}) {
  const { intervalMs = config.checkIntervalMs, onTokenDetected = null } = options;
  if (isMonitoring) return;
  isMonitoring = true;
  let checkCount = 0;

  logger.box('⚡ TOKEN DETECTION ⚡', [`Wallet: ${walletAddress}`, `Interval: ${intervalMs}ms`]);

  while (isMonitoring && !detectedToken) {
    checkCount++;
    try {
      const createdTokens = await getTokensByCreator(walletAddress);
      if (createdTokens?.length > 0) {
        const latest = createdTokens[0];
        logger.thunder(`TOKEN DETECTED: ${latest.mint}`);
        const info = await getTokenInfo(latest.mint);
        detectedToken = { mint: latest.mint, name: latest.name || info?.name || 'Unknown', symbol: latest.symbol || info?.symbol || 'UNK', decimals: 6, creator: walletAddress, metadata: info || {} };
        await saveToken(detectedToken);
        if (onTokenDetected) await onTokenDetected(detectedToken);
        isMonitoring = false;
        return detectedToken;
      }
      if (checkCount % 10 === 0) logger.info('DETECTOR', `Waiting... (#${checkCount})`);
    } catch (error) { logger.error('DETECTOR', error.message); }
    await sleep(intervalMs);
  }
  return detectedToken;
}

export function stopTokenDetection() { isMonitoring = false; }
export function getDetectedToken() { return detectedToken; }

export async function detectToken(walletAddress, options = {}) {
  const existing = await getActiveToken();
  if (existing) { detectedToken = existing; return existing; }
  return startTokenDetection(walletAddress, options);
}

export default { startTokenDetection, stopTokenDetection, getDetectedToken, detectToken };
