-- 🔹 Coluna de saldo
ALTER TABLE users
ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0 NOT NULL;

-- 🔹 Tabela de usuários
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

-- 🔹 Transações
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    type TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 🔹 Apostas
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  numbers TEXT NOT NULL,
  contest INT NOT NULL,
  paid NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 🔹 GARANTE coluna repeats mesmo se tabela já existir
ALTER TABLE bets
ADD COLUMN IF NOT EXISTS repeats INT DEFAULT 1;
