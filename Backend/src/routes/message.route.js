import express from "express";
import { checkMessageController } from "../controllers/message.controller.js";

const router = express.Router();

router.post("/check", checkMessageController);

export default router;