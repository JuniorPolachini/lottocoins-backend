import express from "express";
import { pool } from "./db.js";
import fs from "fs";

const app = express();

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
