import express from "express";
import transactionRoutes from "./routes/transaction.route.js";

const app = express();

app.use(express.json());

app.use("/api/v1/transactions", transactionRoutes);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "route not found",
    data: null,
    errors: [],
  });
});

app.use((err, req, res, next) => {
  const statusCode = err?.statusCode || 500;
  const message = err?.message || "internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors: err?.errors || [],
  });
});

export { app };