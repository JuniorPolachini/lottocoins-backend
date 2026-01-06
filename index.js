import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lotto Coins API — Beta online 🎯"
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("API running on port", port));

import { pool } from "./db.js";
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db_time: result.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
