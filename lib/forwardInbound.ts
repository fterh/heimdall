import { EmailAddress, ParsedMail } from "mailparser";
import Mail from "nodemailer/lib/mailer";
import { domain, email as personalEmail } from "./env";
import getEmailSource from "./getEmailSource";
import sendEmail from "./utils/sendEmail";

export const repackageSenderEmailAddress = (
  alias: string,
  sender: Array<EmailAddress>
): EmailAddress => {
  const senderName = sender.length > 0 ? sender[0].name : "Unspecified";
  const senderAddress = sender.length > 0 ? sender[0].address : "Unspecified";

  return {
    address: `${alias}@${domain}`,
    name: `${senderName} <${senderAddress}>`
  };
};

export const preprocessToAndCcRecipients = (
  parsedMail: ParsedMail
): Array<Array<Mail.Address>> => {
  // We iterate through the "to" and "cc" list,
  // repack the data in a new structure (nodemailer-compatible),
  // and replace our alias identity with our personal email address.

  const mapper = (email: EmailAddress) => {
    return { name: email.name, address: email.address };
  };

  const toRecipients = parsedMail.to.value.map(mapper);
  const ccRecipients = parsedMail.cc?.value.map(mapper) || [];

  return [toRecipients, ccRecipients];
};

/**
 * Forwards received email to personal email.
 * Preserves metadata while avoiding re-sending to other recipients.
 */
export default async (alias: string, parsedMail: ParsedMail): Promise<void> => {
  console.log("Attempting to forward received email to personal email");

  try {
    const source = await getEmailSource(alias);

    const from = repackageSenderEmailAddress(alias, parsedMail.from.value);
    const [toRecipients, ccRecipients] = preprocessToAndCcRecipients(
      parsedMail
    );

    const mailOptions: Mail.Options = {
      from,
      to: toRecipients,
      cc: ccRecipients,
      subject: `[Source: ${source}] ${parsedMail.subject}`,
      html:
        parsedMail.html !== false
          ? (parsedMail.html as string) // Will never be `true`
          : parsedMail.textAsHtml,
      envelope: {
        from: from.address,
        to: personalEmail
      }
    };

    await sendEmail(mailOptions);
    console.log("Successfully forwarded email to personal email");
  } catch (err) {
    console.error(`An error occurred: ${err}`);
  }
};
