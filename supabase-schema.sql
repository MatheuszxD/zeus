CREATE TABLE IF NOT EXISTS zeus_bot_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  wallet_address TEXT,
  balance DECIMAL(20, 9) DEFAULT 0,
  is_running BOOLEAN DEFAULT false,
  current_token TEXT,
  last_cycle TIMESTAMPTZ,
  cycle_count INTEGER DEFAULT 0,
  token_price DECIMAL(20, 12),
  token_market_cap DECIMAL(20, 2),
  token_holdings DECIMAL(30, 9) DEFAULT 0,
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO zeus_bot_status (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS zeus_tokens (
  id SERIAL PRIMARY KEY,
  mint TEXT UNIQUE NOT NULL,
  name TEXT,
  symbol TEXT,
  decimals INTEGER DEFAULT 6,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zeus_trades (
  id SERIAL PRIMARY KEY,
  token_mint TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
  amount_token DECIMAL(30, 9),
  amount_sol DECIMAL(20, 9),
  price_usd DECIMAL(20, 12),
  tx_signature TEXT,
  status TEXT DEFAULT 'SUCCESS',
  pnl_sol DECIMAL(20, 9) DEFAULT 0,
  pnl_percent DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zeus_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_trades INTEGER DEFAULT 0,
  total_pnl_sol DECIMAL(20, 9) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  open_positions INTEGER DEFAULT 0,
  balance DECIMAL(20, 9) DEFAULT 0,
  token_price DECIMAL(20, 12),
  token_market_cap DECIMAL(20, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_stats_row CHECK (id = 1)
);

INSERT INTO zeus_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS zeus_logs (
  id SERIAL PRIMARY KEY,
  level TEXT DEFAULT 'INFO',
  module TEXT DEFAULT 'SYSTEM',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE zeus_bot_status;
ALTER PUBLICATION supabase_realtime ADD TABLE zeus_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE zeus_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE zeus_logs;
