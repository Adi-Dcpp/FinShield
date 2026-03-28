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
const generateMessageExplanation = async (text, signals, classification) => {
  const groqClient = getGroqClient();

  // 🔹 fallback if no API
  if (!groqClient) {
    return "This message shows suspicious patterns. Please verify before taking any action.";
  }

  try {
    const prompt = `
You are a financial fraud detection assistant.

Analyze the following message and explain why it is classified as ${classification}.

Message: "${text}"
Detected Signals: ${signals.join(", ") || "None"}

Instructions:
- Write 1 to 3 short sentences
- Be clear and user-friendly
- Explain reasoning, not just labels
- Avoid technical jargon
- If fraud, warn the user
- If safe, reassure briefly
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
          temperature: 0.4,
          max_tokens: 120,
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

// ✅ EXPORT (CommonJS)
export { generateMessageExplanation };