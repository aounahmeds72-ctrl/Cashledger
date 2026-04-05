-- SQL Schema for CashLedger Application with User Authentication

-- 1. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Asset, Liability, Equity, Income, Expense, Cash, Bank
  opening_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vouchers Table
CREATE TABLE IF NOT EXISTS vouchers (
  id TEXT NOT NULL, -- Custom ID like 'PV-001'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL, -- CR, DR, JV
  total NUMERIC DEFAULT 0,
  narration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id) -- Composite key to allow same ID for different users
);

-- 3. Voucher Entries Table
CREATE TABLE IF NOT EXISTS voucher_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  dr NUMERIC DEFAULT 0,
  cr NUMERIC DEFAULT 0,
  narration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (voucher_id, user_id) REFERENCES vouchers(id, user_id) ON DELETE CASCADE
);

-- 4. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (key, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for per-user data isolation
CREATE POLICY "Users can only access their own accounts" ON accounts 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own vouchers" ON vouchers 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own voucher entries" ON voucher_entries 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own settings" ON settings 
  FOR ALL USING (auth.uid() = user_id);

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
