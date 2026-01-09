import { createClient } from '@supabase/supabase-js';
import config from '../config.js';
import logger from '../utils/logger.js';

let supabase = null;

export function initSupabase() {
  if (supabase) return supabase;
  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  logger.success('SUPABASE', 'Client initialized');
  return supabase;
}

export function getSupabase() { return supabase || initSupabase(); }

export async function saveBotStatus(status) {
  const { data, error } = await getSupabase().from('zeus_bot_status').upsert({ id: 1, ...status, updated_at: new Date().toISOString() }).select().single();
  if (error) logger.error('SUPABASE', `saveBotStatus: ${error.message}`);
  return data;
}

export async function getBotStatus() {
  const { data, error } = await getSupabase().from('zeus_bot_status').select('*').eq('id', 1).single();
  if (error && error.code !== 'PGRST116') logger.error('SUPABASE', `getBotStatus: ${error.message}`);
  return data;
}

export async function saveToken(tokenData) {
  const { data, error } = await getSupabase().from('zeus_tokens').upsert({
    mint: tokenData.mint, name: tokenData.name || 'Unknown', symbol: tokenData.symbol || 'UNK',
    decimals: tokenData.decimals || 6, is_active: true, metadata: tokenData.metadata || {}
  }).select().single();
  if (error) logger.error('SUPABASE', `saveToken: ${error.message}`);
  else logger.success('SUPABASE', `Token saved: ${tokenData.mint}`);
  return data;
}

export async function getActiveToken() {
  const { data, error } = await getSupabase().from('zeus_tokens').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
  if (error && error.code !== 'PGRST116') logger.error('SUPABASE', `getActiveToken: ${error.message}`);
  return data;
}

export async function getAllTrades(limit = 100) {
  const { data, error } = await getSupabase().from('zeus_trades').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) logger.error('SUPABASE', `getAllTrades: ${error.message}`);
  return data || [];
}

export async function saveTrade(tradeData) {
  const { data, error } = await getSupabase().from('zeus_trades').insert({
    token_mint: tradeData.tokenMint, action: tradeData.action, amount_sol: tradeData.amountSol,
    price_usd: tradeData.priceUsd, tx_signature: tradeData.txSignature, pnl_sol: tradeData.pnlSol || 0
  }).select().single();
  if (error) logger.error('SUPABASE', `saveTrade: ${error.message}`);
  return data;
}

export async function calculateStats() {
  const { data: trades, error } = await getSupabase().from('zeus_trades').select('*');
  if (error || !trades || trades.length === 0) return { totalTrades: 0, totalPnlSol: 0, winRate: 0, wins: 0, losses: 0, openPositions: 0 };
  const wins = trades.filter(t => t.pnl_sol > 0).length;
  const losses = trades.filter(t => t.pnl_sol < 0).length;
  const totalPnlSol = trades.reduce((sum, t) => sum + (t.pnl_sol || 0), 0);
  const buys = trades.filter(t => t.action === 'BUY').length;
  const sells = trades.filter(t => t.action === 'SELL').length;
  return { totalTrades: trades.length, totalPnlSol, winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0, wins, losses, openPositions: Math.max(0, buys - sells) };
}

export async function saveStats(stats) {
  const { data, error } = await getSupabase().from('zeus_stats').upsert({ id: 1, ...stats, updated_at: new Date().toISOString() }).select().single();
  if (error) logger.error('SUPABASE', `saveStats: ${error.message}`);
  return data;
}

export async function saveLog(logData) {
  await getSupabase().from('zeus_logs').insert({ level: logData.level || 'INFO', module: logData.module || 'SYSTEM', message: logData.message, metadata: logData.metadata || {} });
}

export async function getRecentLogs(limit = 50) {
  const { data } = await getSupabase().from('zeus_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  return data || [];
}

export default { initSupabase, getSupabase, saveBotStatus, getBotStatus, saveToken, getActiveToken, getAllTrades, saveTrade, calculateStats, saveStats, saveLog, getRecentLogs };
