import { DynamoDB } from "aws-sdk";
import { ParsedMail } from "mailparser";
import config from "../config";
import { email, operationalDomain } from "../env";
import { Commands } from "../commandSet";
import sendEmail from "../utils/sendEmail";

export default async (parsedMail: ParsedMail): Promise<void> => {
  const providedAlias = parsedMail.subject;

  console.log(`Deleting alias=${providedAlias}`);
  const docClient = new DynamoDB.DocumentClient();
  const params: DynamoDB.DocumentClient.DeleteItemInput = {
    TableName: config.tableName,
    Key: {
      alias: providedAlias
    }
  };

  await docClient.delete(params).promise();
  console.log("Deletion successful");

  await sendEmail({
    from: `${Commands.Remove}@${operationalDomain}`,
    to: [email],
    subject: `Delete alias ${providedAlias}`,
    text: "Deletion completed."
  });
};
