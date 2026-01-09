import config from './config.js';
import logger from './utils/logger.js';
import { initializeWallet, formatAddress } from './utils/wallet.js';
import { sleep, formatSOL, formatMarketCap, formatPercent } from './utils/helpers.js';
import { initConnection, getBalanceSOL, getTokenAccounts } from './services/helius.js';
import { initSupabase, saveBotStatus, saveStats, calculateStats, saveLog } from './services/supabase.js';
import { getTokenData } from './services/dexscreener.js';
import { detectToken } from './services/tokenDetector.js';
import { getTokenInfo } from './services/pumpportal.js';
import { startServer, updateBotState } from './api/server.js';

let keypair = null, currentToken = null, isRunning = false, cycleCount = 0;

async function initialize() {
  logger.logo();
  logger.divider();
  logger.info('ZEUS', 'Initializing...');
  keypair = initializeWallet();
  if (!keypair) { logger.error('ZEUS', 'Wallet failed'); process.exit(1); }
  const walletAddress = keypair.publicKey.toBase58();
  logger.success('ZEUS', `Wallet: ${walletAddress}`);
  initConnection();
  const balance = await getBalanceSOL(walletAddress);
  logger.info('ZEUS', `Balance: ${formatSOL(balance * 1e9)} SOL`);
  if (balance < config.minSolReserve) logger.warn('ZEUS', `Low balance! Send SOL to: ${walletAddress}`);
  initSupabase();
  await startServer(config.apiPort);
  updateBotState({ isRunning: true, walletAddress, startedAt: new Date().toISOString() });
  await saveBotStatus({ wallet_address: walletAddress, balance, is_running: true, started_at: new Date().toISOString() });
  await saveLog({ level: 'INFO', module: 'ZEUS', message: 'Bot initialized' });
  logger.divider();
  logger.success('ZEUS', 'Ready!');
  return { keypair, walletAddress, balance };
}

async function waitForToken(walletAddress) {
  logger.info('ZEUS', 'Starting token detection...');
  const targetWallet = config.devWallet || walletAddress;
  logger.info('ZEUS', `Monitoring: ${formatAddress(targetWallet)}`);
  const token = await detectToken(targetWallet, {
    intervalMs: config.checkIntervalMs,
    onTokenDetected: async (t) => { logger.thunder(`Detected: ${t.name} (${t.symbol})`); await saveLog({ level: 'SUCCESS', module: 'DETECTOR', message: `Token: ${t.mint}` }); }
  });
  if (token) { currentToken = token; updateBotState({ currentToken: token }); logger.box('⚡ TOKEN ACTIVE ⚡', [`Name: ${token.name}`, `Symbol: ${token.symbol}`, `Mint: ${token.mint}`]); }
  return token;
}

async function mainCycle() {
  cycleCount++;
  try {
    const walletAddress = keypair.publicKey.toBase58();
    const balance = await getBalanceSOL(walletAddress);
    let tokenData = null;
    if (currentToken) tokenData = await getTokenData(currentToken.mint);
    const tokenAccounts = await getTokenAccounts(walletAddress);
    const tokenHolding = tokenAccounts.find(t => t.mint === currentToken?.mint);
    const stats = await calculateStats();
    logger.divider();
    logger.info('ZEUS', `Cycle #${cycleCount} | Balance: ${formatSOL(balance * 1e9)} SOL`);
    if (currentToken && tokenData) logger.info('ZEUS', `${currentToken.symbol}: ${tokenData.priceUsd?.toFixed(8)} | MCap: ${formatMarketCap(tokenData.marketCap)}`);
    if (stats) logger.info('ZEUS', `PNL: ${formatSOL(stats.totalPnlSol * 1e9)} SOL | WinRate: ${stats.winRate.toFixed(1)}%`);
    await saveBotStatus({ wallet_address: walletAddress, balance, is_running: true, current_token: currentToken?.mint, cycle_count: cycleCount, token_price: tokenData?.priceUsd, token_market_cap: tokenData?.marketCap, token_holdings: tokenHolding?.amount || 0 });
    await saveStats({ ...stats, balance, token_price: tokenData?.priceUsd || 0, token_market_cap: tokenData?.marketCap || 0 });
  } catch (error) { logger.error('ZEUS', `Cycle error: ${error.message}`); await saveLog({ level: 'ERROR', module: 'ZEUS', message: error.message }); }
}

async function startMainLoop() {
  logger.thunder('MAIN LOOP STARTED');
  isRunning = true;
  while (isRunning) { await mainCycle(); await sleep(config.checkIntervalMs); }
}

async function shutdown() {
  logger.warn('ZEUS', 'Shutting down...');
  isRunning = false;
  await saveBotStatus({ is_running: false, stopped_at: new Date().toISOString() });
  await saveLog({ level: 'INFO', module: 'ZEUS', message: 'Shutdown' });
  logger.success('ZEUS', 'Goodbye! ⚡');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  try {
    const { walletAddress } = await initialize();
    await waitForToken(walletAddress);
    await startMainLoop();
  } catch (error) {
    logger.error('ZEUS', `Fatal: ${error.message}`);
    await saveLog({ level: 'FATAL', module: 'ZEUS', message: error.message });
    process.exit(1);
  }
}

main();
