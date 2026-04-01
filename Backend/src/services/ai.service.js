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

export const generateExplanation = async (riskPoint, riskFactors, decision) => {
  const normalizedDecision = ["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"].includes(decision)
    ? decision
    : riskPoint >= 70
      ? "HIGH_RISK"
      : riskPoint >= 35
        ? "MEDIUM_RISK"
        : "LOW_RISK";
  const safeRiskFactors = Array.isArray(riskFactors) ? riskFactors : [];

  const fallbackByDecision = {
    LOW_RISK:
      "Transaction appears consistent with normal behavior. No significant risk indicators detected.",
    MEDIUM_RISK:
      "Transaction has moderate risk signals and should be reviewed before final approval.",
    HIGH_RISK:
      "Transaction shows strong fraud indicators and should be blocked for user protection.",
  };

  const fallbackExplanation = fallbackByDecision[normalizedDecision];
  const groqClient = getGroqClient();

  if (!groqClient) {
    return fallbackExplanation;
  }

  try {
    const prompt = `
You are a financial fraud detection assistant.

Write exactly one sentence, max 28 words.
Tone: clear, calm, professional.
Do not use technical jargon.
Do not mention percentages, probabilities, policies, or legal language.

Hard rules:
1) You must stay fully consistent with the provided Decision.
2) If Decision is LOW_RISK, the sentence must indicate low risk / safe to proceed.
3) If Decision is MEDIUM_RISK, the sentence must indicate moderate concern and recommend review.
4) If Decision is HIGH_RISK, the sentence must indicate high risk and recommend blocking.
5) Mention only reasons present in Risk Factors. Do not invent new reasons.
6) If Risk Factors is None, state that no strong risk indicators were detected.

Decision: ${normalizedDecision}
Risk Score: ${riskPoint}
Risk Factors: ${safeRiskFactors.join(", ") || "None"}
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
          temperature: 0.2,
          max_tokens: 60,
        });

        return response.choices?.[0]?.message?.content?.trim() ||
          fallbackExplanation;
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

    return fallbackExplanation;

  } catch (error) {
    console.error("AI Error:", error.message);

    return fallbackExplanation;
  }
};
