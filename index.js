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
