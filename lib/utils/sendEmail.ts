import { SESV2 } from "aws-sdk";

export interface SendEmailOptions {
  config?: SESV2.ClientConfiguration;
  from: string;
  to: Array<string>;
  cc?: Array<string>;
  subject: string;
  body: string;
}

/**
 * Sends an email using AWS's SDK.
 * Use the sendEmailSMTP module for more advanced use cases,
 * such as when the SMTP envelope should be different from the email headers.
 */
export default async (options: SendEmailOptions): Promise<void> => {
  console.log("Attempting to send response email");
  const ses = new SESV2(options.config);
  const sesParams: SESV2.SendEmailRequest = {
    FromEmailAddress: options.from,
    Destination: {
      ToAddresses: options.to,
      CcAddresses: options.cc
    },
    Content: {
      Simple: {
        Subject: {
          Data: options.subject
        },
        Body: {
          Text: {
            Data: options.body
          }
        }
      }
    }
  };

  await ses.sendEmail(sesParams).promise();
  console.log("Successfully sent response email");
};
