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

app.get("/", (req, res) => res.json({ status: "ok" }));

// ------------------ BET WITH SAFE BALANCE ------------------
app.post("/bet", async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, numbers, contest, cost, repeats } = req.body;

    await client.query("BEGIN");

    const user = await client.query(
      "SELECT balance FROM users WHERE id=$1",
      [user_id]
    );

    if (!user.rowCount)
      throw new Error("Usuário não encontrado");

    const totalCost = cost * repeats;

    if (user.rows[0].balance < totalCost)
      throw new Error("Saldo insuficiente");

    for (let i = 0; i < repeats; i++) {
      await client.query(
        `INSERT INTO bets (user_id, numbers, contest, paid, repeats)
         VALUES ($1,$2,$3,$4,$5)`,
        [user_id, numbers, contest + i, cost, repeats]
      );
    }

    await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id=$2",
      [totalCost, user_id]
    );

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, source)
       VALUES ($1,$2,'bet','lotto-teimosinha')`,
      [user_id, -totalCost]
    );

    await client.query("COMMIT");

    res.json({ ok: true });

  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ------------------ ADD BALANCE ------------------
app.post("/add-balance", async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, amount } = req.body;

    if (amount <= 0) throw new Error("Valor inválido");

    await client.query("BEGIN");

    await client.query(
      "UPDATE users SET balance = balance + $1 WHERE id=$2",
      [amount, user_id]
    );

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, source)
       VALUES ($1,$2,'credit','admin')`,
      [user_id, amount]
    );

    await client.query("COMMIT");

    res.json({ ok: true, message: "Saldo adicionado com sucesso" });

  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});
