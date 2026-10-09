CREATE TABLE public.accounts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(70) NOT NULL
);

CREATE TABLE public.securities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exchange_mic CHAR(4) NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  currency CHAR(3) NOT NULL,
  UNIQUE(exchange_mic, ticker)
);

CREATE TABLE public.holdings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id BIGINT NOT NULL,
  security_id BIGINT NOT NULL,

  CONSTRAINT fk_account_holding
    FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  CONSTRAINT fk_security_holding
    FOREIGN KEY (security_id) REFERENCES public.securities(id),
  UNIQUE(account_id, security_id)
);

CREATE TABLE public.transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  holding_id BIGINT NOT NULL,
  type VARCHAR(12) NOT NULL,
  shares DECIMAL(19,4) NOT NULL,
  price DECIMAL(18,8) NOT NULL,
  fee DECIMAL(19,4) NOT NULL DEFAULT 0,
  transaction_date DATE NOT NULL,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT fk_holding_transaction
    FOREIGN KEY (holding_id) REFERENCES public.holdings(id)
);

CREATE TABLE public.quotes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  security_id BIGINT NOT NULL,
  price DECIMAL(19,4) NOT NULL,
  previous_close_price DECIMAL(19,4),
  quoted_at TIMESTAMPTZ NOT NULL,
  source VARCHAR(50),

  CONSTRAINT fk_securities_quotes
    FOREIGN KEY (security_id) REFERENCES public.securities(id)
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.securities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;