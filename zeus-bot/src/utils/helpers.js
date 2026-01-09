export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry(fn, options = {}) {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 30000, onRetry = null } = options;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(); }
    catch (error) {
      lastError = error;
      if (attempt === maxAttempts) throw error;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      if (onRetry) onRetry(attempt, error, delay);
      await sleep(delay);
    }
  }
  throw lastError;
}

export function formatSOL(lamports, decimals = 4) {
  if (lamports === null || lamports === undefined) return '0';
  return (lamports / 1e9).toFixed(decimals);
}

export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined) return '0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatMarketCap(value) {
  if (!value) return '$0';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return `${value.toFixed(2)}`;
}

export class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  async acquire() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.requests[0]);
      await sleep(waitTime);
      return this.acquire();
    }
    this.requests.push(now);
    return true;
  }
}

export default { sleep, retry, formatSOL, formatPercent, formatMarketCap, RateLimiter };
