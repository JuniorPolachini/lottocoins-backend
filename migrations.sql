-- 🔹 Coluna de saldo no usuário
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

-- 🔹 Transações (extrato)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    type TEXT NOT NULL,         -- deposit | bet | prize | refund | adjust
    source TEXT,                -- tibia | admin | bet_id | import | etc
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
);

-- 🔹 Apostas
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  numbers TEXT NOT NULL,         -- ex: "01,03,07,10"
  contest INT NOT NULL,          -- número do concurso
  paid NUMERIC(12,2) NOT NULL,   -- custo pago
  created_at TIMESTAMP DEFAULT NOW()
);
