-- ADD BALANCE (se ainda não existir)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0 NOT NULL;

-- CREATE USERS
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
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLE BETS
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  numbers TEXT NOT NULL,
  contest INT NOT NULL,
  cost NUMERIC(12,2) NOT NULL,
  repeats INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
