import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateExplanation = async (riskPoint, riskFactors) => {
  try {
    const prompt = `
You are a financial fraud detection assistant.

Explain the transaction risk in one short sentence (max 25 words).
Use clear, calm, and professional language.
Avoid technical jargon.
Focus only on why the transaction is risky.

Risk Score: ${riskPoint}
Risk Factors: ${riskFactors.join(", ")}
`;

    const response = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 60,
    });

    return response.choices[0].message.content.trim();

  } catch (error) {
    console.error("AI Error:", error.message);

    return "Transaction shows unusual behavior. Review recommended.";
  }
};