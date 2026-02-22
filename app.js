import express from "express";
import cors from "cors";
import morgan from "morgan";
import leadsRouter from "./routes/leads.js";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/leads", leadsRouter);

export default app;