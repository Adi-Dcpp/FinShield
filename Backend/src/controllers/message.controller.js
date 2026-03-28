import {checkMessage} from "../services/message.service.js";
import Message from "../models/message.model.js";
import {generateMessageExplanation} from "../services/messageAi.service.js";
import { asyncHandler } from "../utils/async-handler.util.js";

const checkMessageController = asyncHandler(async (req, res) => {
  try {
    const { text } = req.body;

    // 🔹 Validation
    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Message text is required.",
      });
    }

    if (typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message text must be a string.",
      });
    }

    // 🔹 1. Rule-based analysis
    const result = checkMessage(text);

    // 🔹 2. AI Enhancement (SAFE)
    try {
      const aiExplanation = await generateMessageExplanation(
        text,
        result.signals,
        result.classification
      );

      if (aiExplanation) {
        result.explanation = aiExplanation;
      }
    } catch (aiError) {
      console.error("AI failed, using fallback:", aiError.message);
    }

    // 🔹 3. Save to DB (safe)
    try {
      await Message.create({
        text,
        classification: result.classification,
        signals: result.signals,
        explanation: result.explanation,
        riskLevel: result.riskLevel,
      });
    } catch (dbError) {
      console.error("DB save failed:", dbError.message);
    }

    // 🔹 4. Response
    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("Error Checking Message:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

export { checkMessageController };