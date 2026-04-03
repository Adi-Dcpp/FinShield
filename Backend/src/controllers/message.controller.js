import { analyzeMessage } from "../services/messageAnalyzer.service.js";
import Message from "../models/message.model.js";
import { generateMessageExplanation } from "../services/messageAi.service.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { ApiError } from "../utils/api-errors.util.js";
import { ApiResponse } from "../utils/api-response.util.js"

const checkMessageController = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!(text.trim())) {
    throw new ApiError(400, "Text not found")
  }

  const mlResponse = await analyzeMessage(text)
  if (!mlResponse) {
    throw new ApiError(500, "Internal server Error")
  }

  const messageExplanation = await generateMessageExplanation(text, mlResponse.data.signals, mlResponse.data.classification, mlResponse.data.confidence)
  if (!messageExplanation) {
    throw new ApiError(500, "Groq-API failure")
  }

  const response = {
    ...mlResponse.data, "groq": messageExplanation
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      "Message Fetch Successfully",
      response
    )
  )
})


export { checkMessageController };