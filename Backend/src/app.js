import express from "express";
import transactionRoutes from "./routes/transaction.route.js";

const app = express();

app.use(express.json());

app.use("/api/v1/transactions", transactionRoutes);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export { app };