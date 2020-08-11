import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import AWS from 'aws-sdk';
AWS.config.update({region:'us-east-1'});
import { awsSmtpHost, awsSmtpPort, awsSmtpUser, awsSmtpPass, awsParameterStoreName } from "./env";

const ssm = new AWS.SSM();
let smtpPass: string | undefined = undefined;
const getSmtpPass = async (): Promise<string | undefined> => {
  if (smtpPass) {
    return await Promise.resolve(smtpPass);
  }

  const result = await ssm.getParameter({
    Name: awsParameterStoreName,
    WithDecryption: true,
  }).promise();

  smtpPass = result.Parameter ? result.Parameter.Value : undefined;

  return smtpPass;
};

export const createTransporter = (password: string | undefined): Mail => {
  return nodemailer.createTransport({
    host: awsSmtpHost,
    port: Number(awsSmtpPort),
    auth: {
      user: awsSmtpUser,
      pass: password
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

  const password = await getSmtpPass()
  const transporter = createTransporter(password);
  const info = await _sendMail(transporter, mailOptions);
  console.log("Sucessfully sent email");
  console.log(info);
};
