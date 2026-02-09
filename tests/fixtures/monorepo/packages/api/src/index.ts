import express from "express";
const app = express();
app.get("/", (req, res) => res.json({ ok: true }));
export default app;
