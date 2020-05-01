import { ParsedMail } from "mailparser";
import Mail from "nodemailer/lib/mailer";
import { email as personalEmail, operationalDomain } from "./env";
import Alias from "./models/Alias";
import repackageReceivedAttachments from "./repackageReceivedAttachments";
import sendEmail from "./sendEmail";
import senderAddressEncodeDecode from "./senderAddressEncodeDecode";

export const representNameAndEmailAddress = (
  name: string,
  emailAddress: string
): string => {
  if (name === "") {
    return emailAddress;
  }
  return `${name} [${emailAddress}]`;
};

/**
 * Generates forwarded email's "from" header information
 * that encapsualtes original sender's name and email address.
 *
 * Prioritizes original email's "reply-to" header over "from" header.
 */
export const generateFromHeader = (
  aliasValue: string,
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
    name: representNameAndEmailAddress(replyToName, replyToEmailAddress),
    address: senderAddressEncodeDecode.encodeEmailAddress(
      aliasValue,
      replyToEmailAddress
    )
  };
};

export const generateInboundMailOptions = async (
  alias: Alias,
  parsedMail: ParsedMail
): Promise<Mail.Options> => {
  const mailOptions: Mail.Options = {
    from: generateFromHeader(alias.value, parsedMail),
    to: parsedMail.to.value,
    cc: parsedMail.cc?.value,
    subject: parsedMail.subject || "",
    html:
      parsedMail.html !== false
        ? (parsedMail.html as string) // Will never be `true`
        : parsedMail.textAsHtml,
    envelope: {
      from: `${alias.value}@${operationalDomain}`, // For semantics only; this has no significance
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
export default async (
  aliasValue: string,
  parsedMail: ParsedMail
): Promise<void> => {
  console.log("Attempting to forward received email to personal email");

  const alias = await Alias.getAlias(aliasValue);
  if (alias === undefined) {
    console.log("Skipping forwarding received email, as alias does not exist");
    return;
  }
  const mailOptions = await generateInboundMailOptions(alias, parsedMail);
  await sendEmail(mailOptions);
  await alias.didReceiveEmail();

  console.log("Successfully forwarded email to personal email");
};
