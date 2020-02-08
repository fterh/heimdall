import { ParsedMail } from "mailparser";
import Mail from "nodemailer/lib/mailer";
import { email as personalEmail, operationalDomain } from "./env";
import getAliasDescription from "./getAliasDescription";
import repackageReceivedAttachments from "./repackageReceivedAttachments";
import sendEmail from "./sendEmail";
import senderAddressEncodeDecode from "./senderAddressEncodeDecode";

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

export const generateInboundMailOptions = async (
  alias: string,
  parsedMail: ParsedMail
): Promise<Mail.Options> => {
  const mailOptions: Mail.Options = {
    from: generateFromHeader(alias, parsedMail),
    to: parsedMail.to.value,
    cc: parsedMail.cc?.value,
    subject: `[${await getAliasDescription(alias)}] ${parsedMail.subject}`,
    html:
      parsedMail.html !== false
        ? (parsedMail.html as string) // Will never be `true`
        : parsedMail.textAsHtml,
    envelope: {
      from: `${alias}@${operationalDomain}`, // For semantics only; this has no significance
      to: personalEmail
    },
    attachments: repackageReceivedAttachments(parsedMail.attachments)
  };

  return mailOptions;
};

/**
 * Forwards received email to personal email.
 * Preserves metadata while avoiding re-sending to other recipients.
 */
export default async (alias: string, parsedMail: ParsedMail): Promise<void> => {
  console.log("Attempting to forward received email to personal email");

  const mailOptions = await generateInboundMailOptions(alias, parsedMail);
  await sendEmail(mailOptions);

  console.log("Successfully forwarded email to personal email");
};
