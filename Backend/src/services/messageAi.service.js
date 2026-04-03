import Groq from "groq-sdk";

let client = null;
let missingKeyLogged = false;

// Preferred + fallback models
const preferredModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const fallbackModels = ["llama-3.1-8b-instant"];
const candidateModels = [
  ...new Set([preferredModel, ...fallbackModels].filter(Boolean)),
];

// 🔹 Create Groq client safely
const getGroqClient = () => {
  if (client) return client;

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    if (!missingKeyLogged) {
      console.warn("GROQ_API_KEY missing → using fallback explanation.");
      missingKeyLogged = true;
    }
    return null;
  }

  client = new Groq({ apiKey });
  return client;
};

// 🔥 MAIN FUNCTION (FOR MESSAGE DETECTOR)
const generateMessageExplanation = async (text, signals, classification, confidence_score) => {
  const groqClient = getGroqClient();

  // 🔹 fallback if no API
  if (!groqClient) {
    return "This message shows suspicious patterns. Please verify before taking any action.";
  }

  try {
    const confidencePercent = Math.round((confidence_score || 0) * 100);
    const confidenceLevel = (confidence_score || 0) > 0.8 ? "high" : (confidence_score || 0) > 0.5 ? "moderate" : "low";
    const signalsArray = Array.isArray(signals) ? signals : [];

    const prompt = `
You are an expert financial fraud detection assistant analyzing SMS messages for potential scams.

**Message Analysis Request:**

- **Message Text:** "${text || ''}"
- **Detected Signals:** ${signalsArray.length > 0 ? signalsArray.join(", ") : "None detected"}
- **AI Classification:** ${classification || 'UNKNOWN'}
- **Model Confidence:** ${confidencePercent}% (${confidenceLevel} confidence)

**Task:** Provide a clear, user-friendly explanation of why this message was classified as ${classification || 'UNKNOWN'}. Consider the confidence level and detected signals in your reasoning.

**Guidelines:**
- Write 2-4 concise sentences
- Explain the key suspicious elements or safe indicators
- Use the confidence score to qualify your assessment (e.g., "highly likely" for high confidence, "potentially" for low)
- If classified as FRAUD, strongly warn the user and advise immediate action
- If SUSPICIOUS, recommend caution and verification
- If SAFE, provide reassurance with brief reasoning
- Avoid technical jargon; keep it accessible
- Base explanation on the message content and signals, not just the label
`;

    // 🔁 Try models (fallback-safe)
    for (const model of candidateModels) {
      try {
        const response = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        });

        const aiText = response?.choices?.[0]?.message?.content?.trim();

        if (aiText) return aiText;

      } catch (modelError) {
        const msg = modelError?.message || "";

        const isRetryable =
          msg.includes("decommissioned") ||
          msg.includes("not found") ||
          msg.includes("not supported");

        if (!isRetryable) {
          throw modelError;
        }
      }
    }

    // 🔹 fallback if all models fail
    return "This message shows suspicious patterns. Please verify before taking any action.";

  } catch (error) {
    console.error("AI Error:", error.message);

    return "This message shows suspicious patterns. Please verify before taking any action.";
  }
};

export { generateMessageExplanation };