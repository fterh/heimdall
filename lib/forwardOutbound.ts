import addrs from "email-addresses";
import { EmailAddress, ParsedMail } from "mailparser";
import Mail from "nodemailer/lib/mailer";
import { domain } from "./env";
import sendEmail from "./utils/sendEmail";
import senderAddressEncodeDecode from "./utils/senderAddressEncodeDecode";

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

/**
 * Using the received email headers, generate a new list of "to" recipients
 * by substituting unpure alias for original sender's email address where it appears.
 */
export const generateToRecipients = (
  unpureAlias: string,
  originalToRecipients: Array<EmailAddress>
): Array<EmailAddress> => {
  const decomposed = decomposeUnpureAlias(unpureAlias);
  let aliasIsMissing = true;

  const newToRecipients: Array<EmailAddress> = originalToRecipients.map(
    recipient => {
      const parsed = addrs.parseOneAddress(
        recipient.address
      ) as addrs.ParsedMailbox;

      if (parsed.local === unpureAlias) {
        aliasIsMissing = false;
        return {
          name: "",
          address: decomposed.senderAddress
        };
      } else {
        return recipient;
      }
    }
  );

  if (aliasIsMissing) {
    throw new Error(
      `Alias not detected among "to" email addresses; this should not happen.`
    );
  }

  return newToRecipients;
};

// unpureAlias is likely in the format "originalAlias+base64EncodedData",
// so we name it unpureAlias to prevent confusion.
export default async (unpureAlias: string, parsedMail: ParsedMail) => {
  console.log("Attempting to forward received email to personal email");

  const toRecipients = generateToRecipients(unpureAlias, parsedMail.to.value);
  const pureAlias = decomposeUnpureAlias(unpureAlias).pureAlias;

  const mailOptions: Mail.Options = {
    from: `${pureAlias}@${domain}`,
    to: toRecipients,
    cc: parsedMail.cc?.value,
    subject: parsedMail.subject,
    html:
      parsedMail.html !== false
        ? (parsedMail.html as string) // Will never be `true`
        : parsedMail.textAsHtml
  };

  await sendEmail(mailOptions);
  console.log("Successfully forwarded email to original sender");
};
