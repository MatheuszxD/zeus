import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import config from '../config.js';
import logger from '../utils/logger.js';
import { retry } from '../utils/helpers.js';

let connection = null;

export function initConnection() {
  if (connection) return connection;
  connection = new Connection(config.heliusRpcUrl, { commitment: 'confirmed' });
  logger.success('HELIUS', 'RPC connection initialized');
  return connection;
}

export function getConnection() {
  return connection || initConnection();
}

export async function getBalance(publicKey) {
  const conn = getConnection();
  return retry(async () => {
    const pubkey = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
    return await conn.getBalance(pubkey);
  }, { maxAttempts: 3 });
}

export async function getBalanceSOL(publicKey) {
  return (await getBalance(publicKey)) / LAMPORTS_PER_SOL;
}

export async function getTokenAccounts(walletAddress) {
  const conn = getConnection();
  return retry(async () => {
    const pubkey = new PublicKey(walletAddress);
    const response = await conn.getParsedTokenAccountsByOwner(pubkey, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') });
    return response.value.map(account => ({
      mint: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals,
      address: account.pubkey.toBase58()
    }));
  }, { maxAttempts: 3 });
}

export async function checkHealth() {
  try {
    const conn = getConnection();
    const slot = await conn.getSlot();
    return { healthy: true, slot };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

export default { initConnection, getConnection, getBalance, getBalanceSOL, getTokenAccounts, checkHealth };
