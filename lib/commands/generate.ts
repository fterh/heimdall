import { DynamoDB, SESV2 } from "aws-sdk";
import { ParsedMail } from "mailparser";
import generate from "nanoid/generate";
import { domain, email } from "../env";
import { Commands } from "../reserved";

export default async (parsedMail: ParsedMail): Promise<void> => {
  const source = parsedMail.subject;
  const generatedAlias = generate("0123456789abcdefghijklmnopqrstuvwxyz", 13);
  console.log(`Generated alias=${generatedAlias} for source=${source}`);

  console.log("Attempting to store alias-source record");
  const docClient = new DynamoDB.DocumentClient();
  const docParams: DynamoDB.DocumentClient.PutItemInput = {
    TableName: "aliases",
    Item: {
      alias: generatedAlias,
      source
    }
  };

  await docClient.put(docParams).promise();
  console.log("Successfully stored alias-source record");

  console.log("Attempting to send response email");
  const ses = new SESV2();
  const sesParams: SESV2.SendEmailRequest = {
    FromEmailAddress: `${Commands.Generate}@${domain}`,
    Destination: {
      ToAddresses: [email]
    },
    Content: {
      Simple: {
        Subject: {
          Data: `Generated alias: ${generatedAlias}`
        },
        Body: {
          Text: {
            Data: `You have generated ${generatedAlias}@${domain} for "${source}".`
          }
        }
      }
    }
  };

  await ses.sendEmail(sesParams).promise();
  console.log("Successfully sent response email");
};
