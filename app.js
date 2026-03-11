import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth.js";
import businessesRouter from "./routes/businesses.js";
import leadsRouter from "./routes/leads.js";
import usersRouter from "./routes/users.js";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/businesses", businessesRouter);

export default app;
