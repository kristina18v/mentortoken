
import nodemailer from "nodemailer";

// Проверка на email конфигурацијата
export function validateEmailConfiguration() {
  const provider =
  process.env.NODE_ENV === "production"
    ? "gmail"
    : "mailtrap";

  if (!["gmail", "mailtrap"].includes(provider)) {
    throw new Error("InvalidEmailProvider");
  }

  const required =
    provider === "mailtrap"
      ? [
          "MAILTRAP_HOST",
          "MAILTRAP_PORT",
          "MAILTRAP_USER",
          "MAILTRAP_PASS",
          "SMTP_FROM",
        ]
      : [
          "SMTP_HOST",
          "SMTP_PORT",
          "SMTP_USER",
          "SMTP_PASS",
          "SMTP_FROM",
        ];

  for (const key of required) {
    if (!process.env[key]?.trim()) {
      throw new Error(`MissingEmailConfiguration: ${key}`);
    }
  }

  const port = Number(
    provider === "mailtrap"
      ? process.env.MAILTRAP_PORT
      : process.env.SMTP_PORT
  );

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("InvalidSMTPPort");
  }

  if (/[\r\n]/.test(process.env.SMTP_FROM)) {
    throw new Error("InvalidSenderAddress");
  }
}

// Креирај Gmail или Mailtrap конекција
export function createEmailTransport() {
  validateEmailConfiguration();

const provider =
  process.env.NODE_ENV === "production"
    ? "gmail"
    : "mailtrap";
  const isMailtrap = provider === "mailtrap";

  const host = isMailtrap
    ? process.env.MAILTRAP_HOST
    : process.env.SMTP_HOST;

  const port = Number(
    isMailtrap
      ? process.env.MAILTRAP_PORT
      : process.env.SMTP_PORT
  );

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,

connectionTimeout: 30000,
greetingTimeout: 30000,
socketTimeout: 30000,

    auth: {
      user: isMailtrap
        ? process.env.MAILTRAP_USER
        : process.env.SMTP_USER,

      pass: isMailtrap
        ? process.env.MAILTRAP_PASS
        : process.env.SMTP_PASS,
    },
  });
}

// Испраќање email
export default async function sendEmail({ options }) {
  const transporter = createEmailTransport();

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    if (!info.accepted?.length) {
      const error = new Error("EmailNotAccepted");
      error.code = "EDELIVERY";
      throw error;
    }

    return info;
  } finally {
    transporter.close();
  }
}
