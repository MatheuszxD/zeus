import dotenv from 'dotenv';
import { parseBlacklist } from './utils/filters.js';
import logger from './utils/logger.js';

dotenv.config();

function validateConfig() {
  const required = ['HELIUS_RPC_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    logger.error('CONFIG', `Missing: ${missing.join(', ')}`);
    process.exit(1);
  }
}

validateConfig();

export const config = {
  privateKey: process.env.PRIVATE_KEY || '',
  devWallet: process.env.DEV_WALLET || '',
  heliusRpcUrl: process.env.HELIUS_RPC_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  checkIntervalMs: parseInt(process.env.CHECK_INTERVAL_MS || '30000'),
  apiPort: parseInt(process.env.API_PORT || '3001'),
  minSolReserve: parseFloat(process.env.MIN_SOL_RESERVE || '0.01'),
  slippageBps: parseInt(process.env.SLIPPAGE_BPS || '500'),
  priorityFeeLamports: parseInt(process.env.PRIORITY_FEE_LAMPORTS || '100000'),
  blacklistWallets: parseBlacklist(process.env.BLACKLIST_WALLETS),
  apis: {
    pumpPortal: 'https://pumpportal.fun/api/trade-local',
    jupiterQuote: 'https://quote-api.jup.ag/v6/quote',
    jupiterSwap: 'https://quote-api.jup.ag/v6/swap',
    dexScreener: 'https://api.dexscreener.com/latest/dex/tokens',
    pumpFunApi: 'https://frontend-api.pump.fun'
  },
  constants: {
    SOL_MINT: 'So11111111111111111111111111111111111111112',
    LAMPORTS_PER_SOL: 1_000_000_000,
    PUMP_FUN_PROGRAM: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
  }
};

export default config;
