import { SESV2 } from "aws-sdk";

interface SendEmailOptions {
  from: string;
  to: Array<string>;
  subject: string;
  body: string;
}

export default async (options: SendEmailOptions): Promise<void> => {
  console.log("Attempting to send response email");
  const ses = new SESV2();
  const sesParams: SESV2.SendEmailRequest = {
    FromEmailAddress: options.from,
    Destination: {
      ToAddresses: options.to
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
