import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.db.js";

dotenv.config(); // 🔥 VERY IMPORTANT

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
};

startServer();