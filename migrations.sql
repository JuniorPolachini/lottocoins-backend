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
