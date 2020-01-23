import { EmailAddress, ParsedMail } from "mailparser";
import Mail from "nodemailer/lib/mailer";
import { domain, email as personalEmail } from "./env";
import getEmailSource from "./getEmailSource";
import sendEmail from "./utils/sendEmail";
import senderAddressEncodeDecode from "./utils/senderAddressEncodeDecode";

/**
 * Generates "from" header information
 * that encapsulates original sender's name and email address.
 */
export const repackageSenderEmailAddress = (
  alias: string,
  sender: Array<EmailAddress>
): EmailAddress => {
  const senderName = sender.length > 0 ? sender[0].name : "";
  const senderAddress = sender.length > 0 ? sender[0].address : "";

  return {
    address: `${alias}@${domain}`,
    name: `${senderName} <${senderAddress}>`
  };
};

/**
 * Generates "reply-to" header information
 * that encapsualtes original sender's email address.
 *
 * Prioritizes original email's "reply-to" header over "from" header.
 */
export const generateReplyTo = (
  alias: string,
  parsedMail: ParsedMail
): Mail.Address => {
  let replyToEmailAddress = "";

  // "reply-to" takes precedence over "from" header
  if (parsedMail.replyTo && parsedMail.replyTo.value.length > 0) {
    replyToEmailAddress = parsedMail.replyTo.value[0].address;
  } else {
    replyToEmailAddress = parsedMail.from.value[0].address; // Guaranteed to exist
  }

  return {
    name: replyToEmailAddress,
    address: senderAddressEncodeDecode.encodeEmailAddress(
      alias,
      replyToEmailAddress
    )
  };
};

/**
 * Forwards received email to personal email.
 * Preserves metadata while avoiding re-sending to other recipients.
 */
export default async (alias: string, parsedMail: ParsedMail): Promise<void> => {
  console.log("Attempting to forward received email to personal email");

  const source = await getEmailSource(alias);

  const from = repackageSenderEmailAddress(alias, parsedMail.from.value);

  const mailOptions: Mail.Options = {
    from,
    to: parsedMail.to.value,
    cc: parsedMail.cc?.value,
    replyTo: generateReplyTo(alias, parsedMail),
    subject: `[Source: ${source}] ${parsedMail.subject}`,
    html:
      parsedMail.html !== false
        ? (parsedMail.html as string) // Will never be `true`
        : parsedMail.textAsHtml,
    envelope: {
      from: from.address, // For semantics only; this has no significance
      to: personalEmail
    }
  };

  await sendEmail(mailOptions);
  console.log("Successfully forwarded email to personal email");
};
