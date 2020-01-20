import { DynamoDB } from "aws-sdk";
import { ParsedMail } from "mailparser";
import { domain, email } from "../env";
import { Commands } from "../reserved";
import sendResponse from "./sendResponse";

export default async (parsedMail: ParsedMail): Promise<void> => {
  const providedAlias = parsedMail.subject;

  console.log(`Deleting alias=${providedAlias}`);
  const docClient = new DynamoDB.DocumentClient();
  const params: DynamoDB.DocumentClient.DeleteItemInput = {
    TableName: "aliases",
    Key: {
      alias: providedAlias
    }
  };

  await docClient.delete(params).promise();
  console.log("Deletion successful");

  sendResponse(
    `${Commands.Remove}@${domain}`,
    email,
    `Delete alias ${providedAlias}`,
    "Deletion completed."
  );
};
