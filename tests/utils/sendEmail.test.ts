import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { createTransporter, _sendMail } from "../../lib/utils/sendEmail";

jest.mock("nodemailer");

it("should create a transporter with the correct options from environment variables", () => {
  createTransporter();

  expect(nodemailer.createTransport).toHaveBeenCalledWith({
    host: "smtphost.com",
    port: 123,
    auth: {
      user: "smtpuser",
      pass: "smtppass"
    }
  });
});

it("should call the transporter's sendMail method with the correct mail options", async () => {
  const spyTransporter = {
    sendMail: jest.fn()
  };

  await _sendMail((spyTransporter as unknown) as Mail, {
    from: "test@test.com"
  });
  expect(spyTransporter.sendMail).toHaveBeenCalledTimes(1);
  expect(spyTransporter.sendMail).toHaveBeenCalledWith({
    from: "test@test.com"
  });
});
