import express from "express";
import { pool } from "./db.js";
import fs from "fs";

const app = express();
app.use(express.json());

// LOG DE BOOT
console.log("🚀 Inicializando API...");

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lotto Coins API – Beta online 💎"
  });
});

// TESTE DB
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db_time: result.rows[0] });
  } catch (e) {
    console.error("❌ DB TEST ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------------- MIGRATIONS ---------------- */

async function runMigrations() {
  console.log("📄 Carregando migrations.sql...");

  try {
    const sql = fs.readFileSync("./migrations.sql").toString();

    console.log("▶️ Executando migrations...");
    await pool.query(sql);

    console.log("✅ Migrations executed");
  } catch (err) {
    console.error("❌ MIGRATION ERROR:", err);
    throw err;
  }
}

/* -------------- START SERVER -------------- */

const port = process.env.PORT || 8080;

async function start() {
  try {
    await runMigrations();

    app.listen(port, () =>
      console.log(`🟢 API running on port ${port}`)
    );
  } catch (err) {
    console.error("💥 API FAILED TO START:", err);
  }
}

start();
