import express from 'express';
import cors from 'cors';
import config from '../config.js';
import logger from '../utils/logger.js';
import { formatAddress } from '../utils/wallet.js';
import { getBalanceSOL, checkHealth } from '../services/helius.js';
import { getTokenData } from '../services/dexscreener.js';
import { getBotStatus, getActiveToken, getAllTrades, calculateStats } from '../services/supabase.js';

const app = express();
app.use(cors());
app.use(express.json());

let botState = { isRunning: false, walletAddress: null, currentToken: null, startedAt: null };

export function updateBotState(state) { botState = { ...botState, ...state }; }

app.get('/health', async (req, res) => {
  const rpcHealth = await checkHealth();
  res.json({ status: 'ok', bot: { running: botState.isRunning }, rpc: rpcHealth });
});

app.get('/status', async (req, res) => {
  const [dbStatus, balance] = await Promise.all([getBotStatus(), botState.walletAddress ? getBalanceSOL(botState.walletAddress) : 0]);
  res.json({ success: true, data: { isRunning: botState.isRunning, walletAddress: botState.walletAddress, balance, currentToken: botState.currentToken } });
});

app.get('/wallet', async (req, res) => {
  if (!botState.walletAddress) return res.status(400).json({ error: 'No wallet' });
  const balance = await getBalanceSOL(botState.walletAddress);
  res.json({ success: true, data: { address: botState.walletAddress, balance } });
});

app.get('/token', async (req, res) => {
  const token = await getActiveToken();
  if (!token) return res.json({ success: true, data: null });
  const market = await getTokenData(token.mint);
  res.json({ success: true, data: { ...token, market } });
});

app.get('/stats', async (req, res) => res.json({ success: true, data: await calculateStats() }));
app.get('/trades', async (req, res) => res.json({ success: true, data: await getAllTrades(parseInt(req.query.limit) || 50) }));

app.get('/dashboard', async (req, res) => {
  const [status, token, stats, trades, balance] = await Promise.all([getBotStatus(), getActiveToken(), calculateStats(), getAllTrades(20), botState.walletAddress ? getBalanceSOL(botState.walletAddress) : 0]);
  let market = null;
  if (token) market = await getTokenData(token.mint);
  res.json({ success: true, data: { bot: { isRunning: botState.isRunning }, wallet: { address: botState.walletAddress, balance }, token: token ? { ...token, market } : null, stats, trades } });
});

export function startServer(port = config.apiPort) {
  return new Promise(resolve => app.listen(port, () => { logger.success('API', `http://localhost:${port}`); resolve(app); }));
}

export default { app, startServer, updateBotState };
