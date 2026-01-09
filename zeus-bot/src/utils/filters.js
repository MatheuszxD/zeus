import { PublicKey } from '@solana/web3.js';

const KNOWN_PROGRAMS = [
  '11111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
];

const PUMP_FUN_ADDRESSES = [
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  'Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1',
];

export function isPDA(address) {
  try {
    const pubkey = new PublicKey(address);
    return !PublicKey.isOnCurve(pubkey.toBytes());
  } catch { return false; }
}

export function isKnownProgram(address) { return KNOWN_PROGRAMS.includes(address); }
export function isPumpFunAddress(address) { return PUMP_FUN_ADDRESSES.includes(address); }

export function isSpecialWallet(address, options = {}) {
  const { blacklist = [], botWallet = null } = options;
  if (isPDA(address) || isKnownProgram(address) || isPumpFunAddress(address)) return true;
  if (blacklist.includes(address) || (botWallet && address === botWallet)) return true;
  return false;
}

export function parseBlacklist(blacklistString) {
  if (!blacklistString) return [];
  return blacklistString.split(',').map(addr => addr.trim()).filter(Boolean);
}

export default { isPDA, isKnownProgram, isPumpFunAddress, isSpecialWallet, parseBlacklist };
