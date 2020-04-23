import { ParsedMail } from "mailparser";
import Mail from "nodemailer/lib/mailer";

/**
 * Generates an email in reply to another email by
 * utilizing the In-Reply-To and References headers
 * to make threaded conversations possible in email clients.
 */
export default (
  mailOptions: Mail.Options,
  replyTo: ParsedMail
): Mail.Options => {
  console.log("Generating reply email");

  const messageId = replyTo.messageId;

  if (!messageId) {
    console.log("Message-ID not found; returning original mailOptions object");
    return mailOptions;
  }

  let references = replyTo.references || [];
  references.push(messageId);

  return {
    ...mailOptions,
    inReplyTo: messageId,
    references: references
  };
};
