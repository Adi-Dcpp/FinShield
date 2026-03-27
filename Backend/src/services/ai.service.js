import Groq from "groq-sdk";

let client = null;
let missingKeyLogged = false;

const preferredModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const fallbackModels = ["llama-3.3-70b-versatile", "llama3-8b-8192"];
const candidateModels = [
  ...new Set([preferredModel, ...fallbackModels].filter(Boolean)),
];

const getGroqClient = () => {
  if (client) return client;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    if (!missingKeyLogged) {
      console.warn("GROQ_API_KEY is missing; using fallback explanation.");
      missingKeyLogged = true;
    }
    return null;
  }

  client = new Groq({ apiKey });
  return client;
};

export const generateExplanation = async (riskPoint, riskFactors) => {
  const groqClient = getGroqClient();

  if (!groqClient) {
    return "Transaction shows unusual behavior. Review recommended.";
  }

  try {
    const prompt = `
You are a financial fraud detection assistant.

Explain the transaction risk in one short sentence (max 25 words).
Use clear, calm, and professional language.
Avoid technical jargon.
Focus only on why the transaction is risky.

Risk Score: ${riskPoint}
Risk Factors: ${riskFactors.join(", ") || "None"}
`;

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
          temperature: 0.5,
          max_tokens: 60,
        });

        return response.choices?.[0]?.message?.content?.trim() ||
          "Transaction shows unusual behavior. Review recommended.";
      } catch (modelError) {
        const details = modelError?.message || "";
        const isRetriableModelIssue =
          details.includes("decommissioned") ||
          details.includes("model_decommissioned") ||
          details.includes("not found") ||
          details.includes("not supported");

        if (!isRetriableModelIssue) {
          throw modelError;
        }
      }
    }

    return "Transaction shows unusual behavior. Review recommended.";

  } catch (error) {
    console.error("AI Error:", error.message);

    return "Transaction shows unusual behavior. Review recommended.";
  }
};