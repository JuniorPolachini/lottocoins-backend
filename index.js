import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- DB ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ---------------- MIGRATIONS ----------------
async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      balance NUMERIC(12,2) DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      numbers TEXT NOT NULL,
      contest INTEGER NOT NULL,
      repeats INTEGER NOT NULL,
      cost NUMERIC(12,2) NOT NULL,
      paid BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      description TEXT,
      amount NUMERIC(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("Migrations executed");
}

// ---------------- ROUTES ----------------

// Health
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Lotto Coins API – Beta online 💎" });
});

// LIST USERS
app.get("/users", async (req, res) => {
  const result = await pool.query(
    "SELECT id, full_name, email, balance FROM users ORDER BY id"
  );
  res.json(result.rows);
});

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password)
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, balance)
       VALUES ($1,$2,$3,0)
       RETURNING id, full_name, email, balance`,
      [full_name, email, password_hash]
    );

    res.json({
      message: "Usuário criado com sucesso",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

// ADD BALANCE
app.post("/add-balance", async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    await pool.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2",
      [amount, user_id]
    );

    await pool.query(
      "INSERT INTO transactions (user_id, description, amount) VALUES ($1,$2,$3)",
      [user_id, "Saldo adicionado", amount]
    );

    res.json({ message: "Saldo adicionado com sucesso" });
  } catch (err) {
    console.error("ADD BALANCE ERROR:", err);
    res.status(500).json({ error: "Erro" });
  }
});

// IMPORT TIBIACOINS
app.post("/import-tibiacoins", async (req, res) => {
  try {
    const { entries } = req.body;

    for (const e of entries) {
      await pool.query(
        "INSERT INTO transactions (user_id, description, amount) VALUES (1,$1,$2)",
        [e.sender, e.amount]
      );

      await pool.query(
        "UPDATE users SET balance = balance + $1 WHERE id = 1",
        [e.amount]
      );
    }

    res.json({ message: "Importação concluída" });
  } catch (err) {
    console.error("IMPORT ERROR:", err);
    res.status(500).json({ error: "Erro ao importar" });
  }
});

// BET
app.post("/bet", async (req, res) => {
  try {
    const { user_id, numbers, contest, cost, repeats } = req.body;

    const user = await pool.query(
      "SELECT balance FROM users WHERE id = $1",
      [user_id]
    );

    if (!user.rows.length)
      return res.status(404).json({ error: "Usuário não encontrado" });

    if (user.rows[0].balance < cost)
      return res.status(400).json({ error: "Saldo insuficiente" });

    await pool.query(
      `INSERT INTO bets (user_id,numbers,contest,repeats,cost,paid)
       VALUES ($1,$2,$3,$4,$5,false)`,
      [user_id, numbers, contest, repeats, cost]
    );

    await pool.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [cost, user_id]
    );

    res.json({ message: "Aposta registrada com sucesso" });
  } catch (err) {
    console.error("BET ERROR:", err);
    res.status(500).json({ error: "Erro ao registrar aposta" });
  }
});

// ---------------- START ----------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);
  await runMigrations();
});
