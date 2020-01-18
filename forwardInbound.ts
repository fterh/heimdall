import { SESV2 } from "aws-sdk";
import { ParsedMail } from "mailparser";
import { getEmailSource } from "./utils";

/**
 * Forwards received email to personal email.
 */
export default async (alias: string, parsedMail: ParsedMail): Promise<void> => {
  console.log("Attempting to forward received email to personal email");

  const ses = new SESV2();

  try {
    const source = await getEmailSource(alias);
    const params: SESV2.SendEmailRequest = {
      FromEmailAddress: `${alias}@${process.env.DOMAIN}`,
      Destination: {
        ToAddresses: [process.env.EMAIL as string],
        CcAddresses: [],
        BccAddresses: []
      },
      ReplyToAddresses: [],
      FeedbackForwardingEmailAddress: process.env.EMAIL as string,
      Content: {
        Simple: {
          Subject: {
            Data: `[Source: ${source}]: ${parsedMail.subject}`
          },
          Body: {
            Text: {
              Data: parsedMail.text
            },
            Html: {
              Data:
                parsedMail.html !== false
                  ? (parsedMail.html as string) // parsedMail.html will never be `true`
                  : parsedMail.textAsHtml
            }
          }
        }
      }
    };

    await ses.sendEmail(params).promise();
    console.log("Successfully forwarded email to personal email");
  } catch (err) {
    console.error(`An error occurred: ${err}`);
  }
};
