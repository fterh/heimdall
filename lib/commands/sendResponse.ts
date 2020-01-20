import { SESV2 } from "aws-sdk";

export default async (
  from: string,
  to: string,
  subject: string,
  body: string
): Promise<void> => {
  console.log("Attempting to send response email");
  const ses = new SESV2();
  const sesParams: SESV2.SendEmailRequest = {
    FromEmailAddress: from,
    Destination: {
      ToAddresses: [to]
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject
        },
        Body: {
          Text: {
            Data: body
          }
        }
      }
    }
  };

  await ses.sendEmail(sesParams).promise();
  console.log("Successfully sent response email");
};
