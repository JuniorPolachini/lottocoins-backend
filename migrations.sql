-- =========================
-- USERS TABLE
-- =========================
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

-- =========================
-- BETS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS bet (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    numbers TEXT NOT NULL,
    contest INTEGER NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    repeats INTEGER NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- TRANSACTIONS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
