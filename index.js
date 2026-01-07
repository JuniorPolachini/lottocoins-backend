import express from "express";
import { pool } from "./db.js";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lotto Coins API — Beta online 🎯"
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("API running on port", port));

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db_time: result.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

async function runMigrations() {
  const sql = fs.readFileSync("./migrations.sql").toString();
  await pool.query(sql);
  console.log("Migrations executed");
}

runMigrations();


app.post("/register", async (req, res) => {
  try {
    const {
      full_name,
      cpf,
      birth_date,
      email,
      password,
      whatsapp,
      tibia_character,
      accepted_terms
    } = req.body;

    if (!accepted_terms) {
      return res.status(400).json({ error: "Você precisa aceitar os termos." });
    }

    const exists = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR cpf = $2",
      [email, cpf]
    );

    if (exists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "E-mail ou CPF já cadastrados." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users
      (full_name, cpf, birth_date, email, password_hash, whatsapp, tibia_character, accepted_terms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        full_name,
        cpf,
        birth_date,
        email,
        password_hash,
        whatsapp,
        tibia_character,
        accepted_terms
      ]
    );

    res.json({ ok: true, message: "Cadastro realizado com sucesso!" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, balance FROM users"
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
//fim users

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Usuário ou senha inválidos" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(400).json({ error: "Usuário ou senha inválidos" });
    }

    const token = jwt.sign(
      { user_id: user.id },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "7d" }
    );

    res.json({ ok: true, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// importar tcs
app.post("/import-tibiacoins", async (req, res) => {
  try {
    const { entries } = req.body; // lista de linhas já parseadas

    let credited = 0;
    let pending = 0;

    for (const entry of entries) {
      const { sender, amount } = entry;

      if (amount <= 0) continue;

      const user = await pool.query(
        "SELECT id FROM users WHERE tibia_character = $1",
        [sender]
      );

      if (user.rows.length === 0) {
        pending++;
        continue;
      }

      const userId = user.rows[0].id;

      await pool.query(
        "UPDATE users SET balance = balance + $1 WHERE id = $2",
        [amount, userId]
      );

      await pool.query(
        `INSERT INTO transactions (user_id, amount, type, description)
         VALUES ($1,$2,'deposit','Tibia Coins deposit')`,
        [userId, amount]
      );

      credited++;
    }

    res.json({ ok: true, credited, pending });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// fim importar tcs
