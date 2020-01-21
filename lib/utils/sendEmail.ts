import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { awsSmtpHost, awsSmtpPort, awsSmtpUser, awsSmtpPass } from "../env";

export const createTransporter = (): Mail => {
  return nodemailer.createTransport({
    host: awsSmtpHost,
    port: Number(awsSmtpPort),
    auth: {
      user: awsSmtpUser,
      pass: awsSmtpPass
    }
  });
};

// We do this so we can use dependency injection for testing.
export const _sendMail = async (
  transporter: Mail,
  mailOptions: Mail.Options
): Promise<any> => {
  return await transporter.sendMail(mailOptions);
};

/**
 * Sends an email using SMTP.
 * This allows for more advanced use cases,
 * such as when the SMTP envelope should be different from the email headers.
 */
export default async (mailOptions: Mail.Options) => {
  console.log("Attempting to send email");
  const transporter = createTransporter();
  const info = await _sendMail(transporter, mailOptions);
  console.log("Sucessfully sent email");
  console.log(info);
};
