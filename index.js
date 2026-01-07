import express from "express";
import { pool } from "./db.js";
import fs from "fs";

const app = express();
app.use(express.json());

// -------------------------
// RUN MIGRATIONS ON START
// -------------------------
async function runMigrations() {
  try {
    const sql = fs.readFileSync("./migrations.sql").toString();
    await pool.query(sql);
    console.log("Migrations executed");
  } catch (err) {
    console.log("Migration warning:", err.message);
  }
}

// -------------------------
// ROOT
// -------------------------
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lotto Coins API — Beta online 🎯",
  });
});

// -------------------------
// DB TEST
// -------------------------
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db_time: result.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// -------------------------
// REGISTER USER
// -------------------------
app.post("/register", async (req, res) => {
  try {
    const {
      full_name,
      cpf,
      birth_date,
      email,
      password_hash,
      whatsapp,
      tibia_character
    } = req.body;

    const result = await pool.query(
      `INSERT INTO users (
        full_name, cpf, birth_date, email, password_hash, whatsapp, tibia_character
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, full_name, email`,
      [full_name, cpf, birth_date, email, password_hash, whatsapp, tibia_character]
    );

    res.json(result.rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// -------------------------
// LOGIN
// -------------------------
app.post("/login", async (req, res) => {
  try {
    const { email, password_hash } = req.body;

    const result = await pool.query(
      "SELECT id, full_name, balance FROM users WHERE email=$1 AND password_hash=$2 LIMIT 1",
      [email, password_hash]
    );

    if (!result.rowCount)
      return res.status(401).json({ error: "Credenciais inválidas" });

    res.json(result.rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// -------------------------
// LIST USERS
// -------------------------
app.get("/users", async (req, res) => {
  const result = await pool.query(
    "SELECT id, full_name, email, balance FROM users ORDER BY id ASC"
  );
  res.json(result.rows);
});

// -------------------------
// IMPORT TIBIA COINS
// -------------------------
app.post("/import-tibiacoins", async (req, res) => {
  const { entries } = req.body;

  try {
    for (let entry of entries) {
      const { sender, amount } = entry;

      // encontra o usuário
      const user = await pool.query(
        "SELECT id FROM users WHERE tibia_character = $1 LIMIT 1",
        [sender]
      );

      if (!user.rowCount) continue;

      const userId = user.rows[0].id;

      // registra transação
      await pool.query(
        `INSERT INTO transactions (user_id, amount, type, source)
         VALUES ($1,$2,'deposit','tibia')`,
        [userId, amount]
      );

      // atualiza saldo
      await pool.query(
        `UPDATE users SET balance = balance + $1 WHERE id=$2`,
        [amount, userId]
      );
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -------------------------
// START SERVER
// -------------------------
const port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log("API running on port", port);
  await runMigrations();
});
