import express from "express";
import { pool } from "./db.js";
import fs from "fs";

const app = express();
app.use(express.json());

// ---------------- HOME ----------------
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lotto Coins API – Beta online 💎",
  });
});

// ---------------- TESTE DB ----------------
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db_time: result.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------------- LISTAR USERS ----------------
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, balance FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------- IMPORTAR TIBIA COINS ----------------
app.post("/import-tibiacoins", async (req, res) => {
  try {
    const { entries } = req.body;

    for (const e of entries) {
      // encontra usuário pelo nickname
      const user = await pool.query(
        "SELECT id FROM users WHERE tibia_character = $1",
        [e.sender]
      );

      if (user.rows.length === 0) continue;

      await pool.query(
        "UPDATE users SET balance = balance + $1 WHERE id = $2",
        [e.amount, user.rows[0].id]
      );
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------- ADICIONAR SALDO MANUAL ----------------
app.post("/add-balance", async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    await pool.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2",
      [amount, user_id]
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------- FAZER APOSTA ----------------
app.post("/bet", async (req, res) => {
  const { user_id, numbers, contest, cost, repeats } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT balance FROM users WHERE id = $1",
      [user_id]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const balance = Number(userResult.rows[0].balance);
    const totalCost = Number(cost) * (repeats || 1);

    if (balance < totalCost) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // salva aposta primeiro
    await pool.query(
      "INSERT INTO bets (user_id, numbers, contest, cost, repeats) VALUES ($1,$2,$3,$4,$5)",
      [user_id, numbers, contest, cost, repeats || 1]
    );

    // só desconta após salvar aposta
    await pool.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [totalCost, user_id]
    );

    res.json({
      ok: true,
      message: "Bet registered successfully"
    });

  } catch (e) {
    console.error("BET ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});


// ---------------- MIGRATIONS ----------------
async function runMigrations() {
  const sql = fs.readFileSync("./migrations.sql").toString();
  await pool.query(sql);
  console.log("Migrations executed");
}

const port = process.env.PORT || 8080;

app.listen(port, async () => {
  console.log(`API running on port ${port}`);
  await runMigrations();
});
