import addrs from "email-addresses";
import { EmailAddress, ParsedMail } from "mailparser";
import Mail from "nodemailer/lib/mailer";
import { operationalDomain } from "./env";
import repackageReceivedAttachments from "./repackageReceivedAttachments";
import sendEmail from "./sendEmail";
import senderAddressEncodeDecode from "./senderAddressEncodeDecode";

interface DecomposedUnpureAliasData {
  pureAlias: string;
  senderAddress: string;
}

/**
 * Abstraction wrapper around the senderAddressEncodeDecode module
 * to handle edge cases.
 */
export const decomposeUnpureAlias = (
  unpureAlias: string
): DecomposedUnpureAliasData => {
  const decoded = senderAddressEncodeDecode.decodeUnpureAlias(unpureAlias);

  if (decoded.senderAddress === "") {
    throw new Error(
      "Original sender address not found. This could happen when sending an email directly to alias."
    );
  }

  return {
    pureAlias: decoded.alias,
    senderAddress: decoded.senderAddress
  };
};

export const generateOriginalSenderEmailAddress = (
  unpureAlias: string,
  originalToRecipients: Array<EmailAddress>
): EmailAddress => {
  const decomposed = decomposeUnpureAlias(unpureAlias);
  let aliasIsMissing = true;

  const newToRecipients: Array<EmailAddress> = originalToRecipients
    // Convert into parsed objects
    .map(
      recipient =>
        addrs.parseOneAddress(recipient.address) as addrs.ParsedMailbox
    )
    // Remove all other recipients except for (unpure) alias
    .filter(parsedRecipient => parsedRecipient.local === unpureAlias)
    // Generate original sender's email address object
    .map(() => {
      aliasIsMissing = false;
      return {
        name: "",
        address: decomposed.senderAddress
      };
    });

  if (aliasIsMissing) {
    throw new Error(
      `Alias not detected among "to" email addresses; this should not happen.`
    );
  }

  return newToRecipients[0];
};

export const generateOutboundMailOptions = (
  unpureAlias: string,
  parsedMail: ParsedMail
): Mail.Options => {
  const originalSender = generateOriginalSenderEmailAddress(
    unpureAlias,
    parsedMail.to.value
  );

  const pureAlias = decomposeUnpureAlias(unpureAlias).pureAlias;

  const mailOptions: Mail.Options = {
    from: `${pureAlias}@${operationalDomain}`,
    to: originalSender,
    subject: parsedMail.subject,
    html:
      parsedMail.html !== false
        ? (parsedMail.html as string) // Will never be `true`
        : parsedMail.textAsHtml,
    attachments: repackageReceivedAttachments(parsedMail.attachments)
  };

  return mailOptions;
};

// unpureAlias is likely in the format "originalAlias+base64EncodedData",
// so we name it unpureAlias to prevent confusion.
export default async (unpureAlias: string, parsedMail: ParsedMail) => {
  console.log("Attempting to forward received email to personal email");

  const mailOptions = generateOutboundMailOptions(unpureAlias, parsedMail);
  await sendEmail(mailOptions);

  console.log("Successfully forwarded email to original sender");
};
