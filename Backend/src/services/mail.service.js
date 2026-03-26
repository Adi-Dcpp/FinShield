import nodemailer from "nodemailer";
import Mailgen from "mailgen";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

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
  const email = {
    body: {
      name: user.name,
      intro:
        "A suspicious transaction was detected.",

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

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: user.email,
    subject: "FinShield Alert: High-Risk Transaction",
    html: emailBody,
  });
};