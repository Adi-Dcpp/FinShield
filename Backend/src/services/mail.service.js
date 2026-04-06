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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientBrevoError = (err) => {
  const statusCode = err?.response?.status;

  return (
    !statusCode ||
    statusCode === 408 ||
    statusCode === 425 ||
    statusCode === 429 ||
    statusCode >= 500
  );
};

const normalizeEmail = (value) => value?.trim().toLowerCase();

const assertValidEmail = (label, value) => {
  if (!value || !EMAIL_REGEX.test(value)) {
    throw new Error(`Invalid ${label} email: ${value || "missing"}`);
  }
};

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

  const senderEmail = normalizeEmail(process.env.BREVO_SENDER_EMAIL);
  const recipientEmail = normalizeEmail(user?.email);

  assertValidEmail("sender", senderEmail);
  assertValidEmail("recipient", recipientEmail);

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
  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await emailApi.sendTransacEmail({
        sender: {
          email: senderEmail,
          name: "FinShield",
        },
        to: [{ email: recipientEmail }],
        subject: "🚨 FinShield Alert: High-Risk Transaction",
        htmlContent: emailBody,
      });

      return;
    } catch (err) {
      lastError = err;

      if (!isTransientBrevoError(err) || attempt === maxAttempts) {
        break;
      }

      await delay(250 * attempt);
    }
  }

  const providerMessage =
    lastError?.response?.body?.message ||
    lastError?.response?.text ||
    lastError?.message ||
    "unknown mail provider error";

  throw new Error(`Brevo send failed: ${providerMessage}`);
};