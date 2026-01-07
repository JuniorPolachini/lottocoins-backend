-- ADICIONA COLUNA DE SALDO (CASO AINDA NÃO EXISTA)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='balance'
    ) THEN
        ALTER TABLE users
        ADD COLUMN balance NUMERIC(12,2) DEFAULT 0 NOT NULL;
    END IF;
END $$;

-----------------------------------------------------
-- TABELA DE USUÁRIOS (GARANTIR QUE EXISTE)
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  tibia_character TEXT NOT NULL,
  cep VARCHAR(12),
  street TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  accepted_terms BOOLEAN DEFAULT false,
  balance NUMERIC(12,2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-----------------------------------------------------
-- TABELA DE TRANSAÇÕES (CRÉDITOS / DÉBITOS)
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL,          -- credit | debit
  source TEXT,                 -- ex: import, bet, admin
  created_at TIMESTAMP DEFAULT NOW()
);

-----------------------------------------------------
-- TABELA DE APOSTAS
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  numbers TEXT NOT NULL,
  contest INTEGER NOT NULL,
  cost NUMERIC(12,2) NOT NULL,
  repeats INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
