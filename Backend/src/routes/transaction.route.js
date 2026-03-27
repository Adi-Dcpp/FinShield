import express from "express";
import {
  getReview,
  proceedTransaction,
  declineTransaction,
  getHistory,
} from "../controllers/riskSimulation.controller.js";

const router = express.Router();

router.post("/review", getReview);

router.post("/proceed", proceedTransaction);

router.post("/decline", declineTransaction);

router.post("/history", getHistory);

export default router;