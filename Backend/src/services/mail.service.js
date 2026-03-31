import SibApiV3Sdk from "sib-api-v3-sdk";
import Mailgen from "mailgen";

const client = SibApiV3Sdk.ApiClient.instance;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "FinShield",
    link: "https://yourapp.com",
  },
});

export const sendFraudAlertEmail = async ({
  user,
  transaction,
  riskPoint,
}) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is missing");
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    throw new Error("BREVO_SENDER_EMAIL is missing");
  }

  // Ensure the key is attached after env is loaded and before each send call.
  client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

  const email = {
    body: {
      name: user.name,
      intro: "A suspicious transaction was detected.",

      table: {
        data: [
          {
            item: "Amount",
            description: `₹${transaction.amount}`,
          },
          {
            item: "Device",
            description: transaction.deviceId,
          },
          {
            item: "Location",
            description: transaction.geoCountry || "Unknown",
          },
          {
            item: "Risk Score",
            description: riskPoint,
          },
        ],
      },

      action: {
        instructions:
          "If this wasn't you, please secure your account immediately.",
        button: {
          color: "#FF4D4F",
          text: "Secure Account",
          link: "https://yourapp.com/security",
        },
      },

      outro: "If you recognize this activity, no further action is required.",
    },
  };

  const emailBody = mailGenerator.generate(email);

  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "FinShield",
      },
      to: [{ email: user.email }],
      subject: "🚨 FinShield Alert: High-Risk Transaction",
      htmlContent: emailBody,
    });
  } catch (err) {
    const providerMessage =
      err?.response?.body?.message ||
      err?.response?.text ||
      err?.message ||
      "unknown mail provider error";

    throw new Error(`Brevo send failed: ${providerMessage}`);
  }
};