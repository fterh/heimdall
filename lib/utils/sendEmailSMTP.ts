import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { awsSmtpHost, awsSmtpPort, awsSmtpUser, awsSmtpPass } from "../env";

/**
 * Sends an email using SMTP.
 * This allows for more advanced use cases,
 * such as when the SMTP envelope should be different from the email headers.
 */
export default async (mailOptions: Mail.Options) => {
  console.log("Attempting to send email");

  const transporter = nodemailer.createTransport({
    host: awsSmtpHost,
    port: Number(awsSmtpPort),
    auth: {
      user: awsSmtpUser,
      pass: awsSmtpPass
    }
  });

  const info = await transporter.sendMail(mailOptions);

  console.log("Sucessfully sent email");
  console.log(info);
};
