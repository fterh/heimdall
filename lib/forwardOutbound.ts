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
  const decoded = senderAddressEncodeDecode.decodeUnpureAliasValue(
    unpureAliasValue
  );

  return {
    pureAliasValue: decoded.aliasValue,
    senderAddress: decoded.senderAddress
  };
};

export const generateOutboundMailOptions = ({
  unpureAliasValue,
  alias,
  parsedMail
}: {unpureAliasValue: string, alias: Alias, parsedMail: ParsedMail}): Mail.Options => {
  let {pureAliasValue, senderAddress} = decomposeUnpureAliasValue(unpureAliasValue);

  if (!senderAddress) {
    if (alias.email) {
      senderAddress = alias.email;
    } else {
      throw new Error(
        `Missing sender address for email ${unpureAliasValue}`
      )
    } 
  }

  const mailOptions: Mail.Options = {
    from: `${pureAliasValue}@${operationalDomain}`,
    to: {name: '', address: senderAddress},
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

  const pureAliasValue = decomposeUnpureAliasValue(unpureAliasValue)
    .pureAliasValue;

  const alias = await Alias.getAlias(pureAliasValue);
  if (alias === undefined) {
    throw new Error(`Alias=${pureAliasValue} not found in database!`);
  }

  const mailOptions = generateOutboundMailOptions({alias, unpureAliasValue, parsedMail});
  await sendEmail(mailOptions);
  await alias.didSendEmail();

  console.log("Successfully forwarded email to original sender");
};
