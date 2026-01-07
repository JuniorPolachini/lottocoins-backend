import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors());

/* RUN MIGRATIONS */
async function runMigrations() {
  const sql = fs.readFileSync("./migrations.sql").toString();
  await pool.query(sql);
  console.log("Migrations executed");
}
runMigrations();

/* HOME */
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Lotto Coins API – Online 💎" });
});

/* REGISTER */
app.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, cpf } = req.body;

    if (!full_name || !email || !password || !cpf) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password, cpf, balance)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING id, full_name, email, cpf, balance`,
      [full_name, email, hashed, cpf]
    );

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user: result.rows[0]
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* LIST USERS */
app.get("/users", async (_, res) => {
  const result = await pool.query(
    "SELECT id, full_name, email, balance FROM users"
  );
  res.json(result.rows);
});

/* ADD BALANCE */
app.post("/add-balance", async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    await pool.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [
      amount,
      user_id,
    ]);

    await pool.query(
      "INSERT INTO transactions(user_id,amount) VALUES($1,$2)",
      [user_id, amount]
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* IMPORT TIBIA COINS */
app.post("/import-tibiacoins", async (req, res) => {
  try {
    const { entries } = req.body;

    for (const e of entries) {
      await pool.query(
        "INSERT INTO transactions(user_id,amount) VALUES($1,$2)",
        [1, e.amount]
      );

      await pool.query(
        "UPDATE users SET balance = balance + $1 WHERE id = 1",
        [e.amount]
      );
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* BET */
app.post("/bet", async (req, res) => {
  try {
    const { user_id, numbers, contest, cost, repeats } = req.body;

    // desconta saldo
    await pool.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [cost, user_id]
    );

    // salva aposta
    await pool.query(
      `INSERT INTO bets(user_id,numbers,contest,cost,repeats,paid)
       VALUES($1,$2,$3,$4,$5,true)`,
      [user_id, numbers, contest, cost, repeats]
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("API running on port", port));



app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db_time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
