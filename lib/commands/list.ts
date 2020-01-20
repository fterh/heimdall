import { DynamoDB, SESV2 } from "aws-sdk";
import { domain, email } from "../env";
import { Commands } from "../reserved";

const respond = async (body: string): Promise<void> => {
  console.log("Attempting to send response email");
  const ses = new SESV2();
  const sesParams: SESV2.SendEmailRequest = {
    FromEmailAddress: `${Commands.List}@${domain}`,
    Destination: {
      ToAddresses: [email]
    },
    Content: {
      Simple: {
        Subject: {
          Data: `Alias list (${new Date()})`
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
    return await respond("No aliases found.");
  }

  let mightHaveMoreRecords = false;
  let hasMalformedRecords = false;

  if (records.LastEvaluatedKey) {
    mightHaveMoreRecords = true;
    console.log(
      "Scan results' LastEvaluatedKey is not undefined; there might be more records in the results set"
    );
  }

  let output = "Alias : Source\n";
  records.Items?.forEach(item => {
    if (item.source === undefined) {
      hasMalformedRecords = true;
      return console.log(
        `Record with alias=${item.alias} is missing the "source" attribute. Skipping.`
      );
    }
    output += `${item.alias} : ${item.source}\n`;
  });

  if (mightHaveMoreRecords) {
    output +=
      "There might be more records in the results set. Check the logs and database for more information.";
  }

  if (hasMalformedRecords) {
    output +=
      "The database contains malformed records. Check the logs and database for more information.";
  }

  await respond(output);
};
