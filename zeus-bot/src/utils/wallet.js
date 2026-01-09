import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.join(__dirname, '../../.env');

export function generateWallet() {
  const keypair = Keypair.generate();
  const privateKeyBase58 = bs58.encode(keypair.secretKey);
  const publicKey = keypair.publicKey.toBase58();
  return { keypair, privateKeyBase58, publicKey };
}

export function loadWallet(privateKeyBase58) {
  try {
    const secretKey = bs58.decode(privateKeyBase58);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    logger.error('WALLET', `Failed to load wallet: ${error.message}`);
    return null;
  }
}

export function savePrivateKeyToEnv(privateKeyBase58) {
  try {
    let envContent = fs.readFileSync(ENV_PATH, 'utf8');
    envContent = envContent.replace(/PRIVATE_KEY=.*/, `PRIVATE_KEY=${privateKeyBase58}`);
    fs.writeFileSync(ENV_PATH, envContent);
    logger.success('WALLET', 'Private key saved to .env');
    return true;
  } catch (error) {
    logger.error('WALLET', `Failed to save: ${error.message}`);
    return false;
  }
}

export function hasPrivateKey() {
  return process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length > 0;
}

export function initializeWallet() {
  if (hasPrivateKey()) {
    const keypair = loadWallet(process.env.PRIVATE_KEY);
    if (keypair) {
      logger.success('WALLET', `Loaded: ${keypair.publicKey.toBase58()}`);
      return keypair;
    }
  }
  logger.warn('WALLET', 'No wallet found, generating new...');
  const { keypair, privateKeyBase58, publicKey } = generateWallet();
  logger.divider();
  logger.box('⚡ NEW WALLET GENERATED ⚡', ['', `Public Key: ${publicKey}`, '', `Private Key: ${privateKeyBase58}`, '', '⚠️ SAVE THIS KEY!', '']);
  logger.divider();
  savePrivateKeyToEnv(privateKeyBase58);
  process.env.PRIVATE_KEY = privateKeyBase58;
  return keypair;
}

export function formatAddress(address, chars = 4) {
  if (!address) return 'N/A';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export default { generateWallet, loadWallet, savePrivateKeyToEnv, hasPrivateKey, initializeWallet, formatAddress };
