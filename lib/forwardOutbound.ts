import addrs from "email-addresses";
import { EmailAddress, ParsedMail } from "mailparser";
import Mail from "nodemailer/lib/mailer";
import { operationalDomain } from "./env";
import Alias from "./models/Alias";
import repackageReceivedAttachments from "./repackageReceivedAttachments";
import sendEmail from "./sendEmail";
import senderAddressEncodeDecode from "./senderAddressEncodeDecode";

interface DecomposedUnpureAliasData {
  pureAliasValue: string;
  senderAddress: string;
}

/**
 * Abstraction wrapper around the senderAddressEncodeDecode module
 * to handle edge cases.
 */
export const decomposeUnpureAliasValue = (
  unpureAliasValue: string
): DecomposedUnpureAliasData => {
  const decoded =
    senderAddressEncodeDecode.decodeUnpureAliasValue(unpureAliasValue);

  if (decoded.senderAddress === "") {
    throw new Error(
      "Original sender address not found. This could happen when sending an email directly to alias."
    );
  }

  return {
    pureAliasValue: decoded.aliasValue,
    senderAddress: decoded.senderAddress
  };
};

export const generateOriginalSenderEmailAddress = (
  unpureAliasValue: string,
  originalToRecipients: Array<EmailAddress>
): EmailAddress => {
  const decomposed = decomposeUnpureAliasValue(unpureAliasValue);
  let aliasIsMissing = true;

  const newToRecipients: Array<EmailAddress> = originalToRecipients
    // Convert into parsed objects
    .map(
      recipient =>
        addrs.parseOneAddress(recipient.address) as addrs.ParsedMailbox
    )
    // Remove all other recipients except for (unpure) alias
    .filter(parsedRecipient => parsedRecipient.local === unpureAliasValue)
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
  unpureAliasValue: string,
  parsedMail: ParsedMail
): Mail.Options => {
  const originalSender = generateOriginalSenderEmailAddress(
    unpureAliasValue,
    parsedMail.to.value
  );

  const pureAlias = decomposeUnpureAliasValue(unpureAliasValue).pureAliasValue;

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

// unpureAliasValue is likely in the format "originalAlias+base64EncodedData",
// so we name it unpure to prevent confusion.
export default async (unpureAliasValue: string, parsedMail: ParsedMail) => {
  console.log("Attempting to forward received email to original sender");

  const pureAliasValue =
    decomposeUnpureAliasValue(unpureAliasValue).pureAliasValue;

  const alias = await Alias.getAlias(pureAliasValue);
  if (alias === undefined) {
    throw new Error(`Alias=${pureAliasValue} not found in database!`);
  }

  const mailOptions = generateOutboundMailOptions(unpureAliasValue, parsedMail);
  await sendEmail(mailOptions);
  await alias.didSendEmail();

  console.log("Successfully forwarded email to original sender");
};
