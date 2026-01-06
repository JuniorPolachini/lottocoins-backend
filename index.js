import express from "express";
import { pool } from "./db.js";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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


app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, full_name, email FROM users");
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
