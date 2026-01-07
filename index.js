import express from "express";
import { pool } from "./db.js";
import fs from "fs";

const app = express();
app.use(express.json());

async function runMigrations() {
  try {
    const sql = fs.readFileSync("./migrations.sql").toString();
    await pool.query(sql);
    console.log("Migrations executed");
  } catch (err) {
    console.log("Migration warning:", err.message);
  }
}

app.get("/", (req, res) => {
  res.json({ status: "ok", app: "Lotto Coins API" });
});

app.get("/users", async (req, res) => {
  const r = await pool.query(
    "SELECT id, full_name, email, balance FROM users ORDER BY id ASC"
  );
  res.json(r.rows);
});

// ---------------- REGISTER ----------------
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

    const r = await pool.query(
      `INSERT INTO users (
        full_name, cpf, birth_date, email, password_hash, whatsapp, tibia_character
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, full_name, email`,
      [full_name, cpf, birth_date, email, password_hash, whatsapp, tibia_character]
    );

    res.json(r.rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// -------------- IMPORT CREDITS ---------------
app.post("/import-tibiacoins", async (req, res) => {
  try {
    const { entries } = req.body;

    for (let entry of entries) {
      const { sender, amount } = entry;

      const user = await pool.query(
        "SELECT id FROM users WHERE tibia_character=$1 LIMIT 1",
        [sender]
      );

      if (!user.rowCount) continue;

      const userId = user.rows[0].id;

      await pool.query(
        `INSERT INTO transactions (user_id, amount, type, source)
         VALUES ($1,$2,'deposit','tibia')`,
        [userId, amount]
      );

      await pool.query(
        "UPDATE users SET balance = balance + $1 WHERE id=$2",
        [amount, userId]
      );
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -------------- BET WITH TEIMOSINHA ---------------
app.post("/bet", async (req, res) => {
  try {
    const { user_id, numbers, contest, cost, repeats } = req.body;

    const user = await pool.query(
      "SELECT balance FROM users WHERE id=$1",
      [user_id]
    );

    if (!user.rowCount)
      return res.status(404).json({ error: "Usuário não encontrado" });

    const totalCost = cost * repeats;

    if (user.rows[0].balance < totalCost)
      return res.status(400).json({ error: "Saldo insuficiente" });

    await pool.query(
      "UPDATE users SET balance = balance - $1 WHERE id=$2",
      [totalCost, user_id]
    );

    await pool.query(
      `INSERT INTO transactions (user_id, amount, type, source)
       VALUES ($1,$2,'bet','lotto-teimosinha')`,
      [user_id, -totalCost]
    );

    for (let i = 0; i < repeats; i++) {
      await pool.query(
        `INSERT INTO bets (user_id, numbers, contest, paid, repeats)
         VALUES ($1,$2,$3,$4,$5)`,
        [user_id, numbers, contest + i, cost, repeats]
      );
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log("API running on port", port);
  await runMigrations();
});
