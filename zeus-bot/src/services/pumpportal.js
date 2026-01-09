import { VersionedTransaction } from '@solana/web3.js';
import config from '../config.js';
import logger from '../utils/logger.js';
import { retry } from '../utils/helpers.js';
import { getConnection } from './helius.js';

const PUMP_FUN_API = config.apis.pumpFunApi;

export async function getTokenInfo(mintAddress) {
  return retry(async () => {
    const response = await fetch(`${PUMP_FUN_API}/coins/${mintAddress}`);
    if (!response.ok) { if (response.status === 404) return null; throw new Error(`Pump.fun error: ${response.status}`); }
    const data = await response.json();
    return { mint: data.mint, name: data.name, symbol: data.symbol, creator: data.creator, createdAt: data.created_timestamp, marketCap: data.usd_market_cap, complete: data.complete };
  }, { maxAttempts: 3, baseDelay: 1000 });
}

export async function getTokensByCreator(creatorAddress) {
  return retry(async () => {
    const response = await fetch(`${PUMP_FUN_API}/coins/user-created-coins/${creatorAddress}`);
    if (!response.ok) throw new Error(`Pump.fun error: ${response.status}`);
    return await response.json() || [];
  }, { maxAttempts: 3 });
}

export async function executeTrade(params) {
  const { keypair, mint, action, amount, slippageBps = config.slippageBps, priorityFee = config.priorityFeeLamports } = params;
  return retry(async () => {
    const response = await fetch(config.apis.pumpPortal, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: keypair.publicKey.toBase58(), action, mint, amount, denominatedInSol: true, slippage: slippageBps / 100, priorityFee })
    });
    if (!response.ok) throw new Error(`PumpPortal error: ${await response.text()}`);
    const txData = await response.arrayBuffer();
    const tx = VersionedTransaction.deserialize(new Uint8Array(txData));
    tx.sign([keypair]);
    const connection = getConnection();
    const signature = await connection.sendTransaction(tx, { skipPreflight: false });
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
    logger.thunder(`Trade: ${action.toUpperCase()} - ${signature}`);
    return { success: true, signature, action, mint, amount };
  }, { maxAttempts: 2, baseDelay: 2000 });
}

export async function buyToken(keypair, mint, solAmount) { return executeTrade({ keypair, mint, action: 'buy', amount: solAmount }); }
export async function sellToken(keypair, mint, tokenAmount) { return executeTrade({ keypair, mint, action: 'sell', amount: tokenAmount }); }

export default { getTokenInfo, getTokensByCreator, executeTrade, buyToken, sellToken };
