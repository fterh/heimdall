import { DynamoDB } from "aws-sdk";
import { domain, email } from "../env";
import { Commands } from "../reserved";
import sendEmail from "../utils/sendEmail";

export default async (): Promise<void> => {
  const docClient = new DynamoDB.DocumentClient();
  const docParams: DynamoDB.DocumentClient.ScanInput = {
    TableName: "aliases"
  };

  const records: DynamoDB.DocumentClient.ScanOutput = await docClient
    .scan(docParams)
    .promise();

  console.log("Successfully scanned database for records");

  if (records.Items && records.Items.length === 0) {
    return await sendEmail({
      from: `${Commands.List}@${domain}`,
      to: [email],
      subject: `Alias list (${new Date()})`,
      text: "No aliases found."
    });
  }

  let mightHaveMoreRecords = false;
  let hasMalformedRecords = false;

  if (records.LastEvaluatedKey) {
    mightHaveMoreRecords = true;
    console.log(
      "Scan results' LastEvaluatedKey is not undefined; there might be more records in the results set"
    );
  }

  let output = "Alias : Description\n";
  records.Items?.forEach(item => {
    if (item.description === undefined) {
      hasMalformedRecords = true;
      return console.log(
        `Record with alias=${item.alias} is missing the "description" attribute. Skipping.`
      );
    }
    output += `${item.alias} : ${item.description}\n`;
  });

  if (mightHaveMoreRecords) {
    output +=
      "There might be more records in the results set. Check the logs and database for more information.";
  }

  if (hasMalformedRecords) {
    output +=
      "The database contains malformed records. Check the logs and database for more information.";
  }

  await sendEmail({
    from: `${Commands.List}@${domain}`,
    to: [email],
    subject: `Alias list (${new Date()})`,
    text: output
  });
};
