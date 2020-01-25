import { ParsedMail } from "mailparser";
import Mail from "nodemailer/lib/mailer";
import { domain, email as personalEmail } from "./env";
import getEmailSource from "./getEmailSource";
import sendEmail from "./utils/sendEmail";
import senderAddressEncodeDecode from "./utils/senderAddressEncodeDecode";

/**
 * Generates forwarded email's "from" header information
 * that encapsualtes original sender's name and email address.
 *
 * Prioritizes original email's "reply-to" header over "from" header.
 */
export const generateFromHeader = (
  alias: string,
  parsedMail: ParsedMail
): Mail.Address => {
  let replyToEmailAddress = "";
  let replyToName = "";

  // "reply-to" takes precedence over "from" header
  if (parsedMail.replyTo && parsedMail.replyTo.value.length > 0) {
    replyToEmailAddress = parsedMail.replyTo.value[0].address;
    replyToName = parsedMail.replyTo.value[0].name;
  } else {
    // Guaranteed to exist
    replyToEmailAddress = parsedMail.from.value[0].address;
    replyToName = parsedMail.from.value[0].name;
  }

  return {
    name: `${replyToName} <${replyToEmailAddress}>`,
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

  const from = generateFromHeader(alias, parsedMail);

  const mailOptions: Mail.Options = {
    from,
    to: parsedMail.to.value,
    cc: parsedMail.cc?.value,
    subject: `[Source: ${source}] ${parsedMail.subject}`,
    html:
      parsedMail.html !== false
        ? (parsedMail.html as string) // Will never be `true`
        : parsedMail.textAsHtml,
    envelope: {
      from: `${alias}@${domain}`, // For semantics only; this has no significance
      to: personalEmail
    }
  };

  await sendEmail(mailOptions);
  console.log("Successfully forwarded email to personal email");
};
