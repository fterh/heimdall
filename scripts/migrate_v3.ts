/**
 * v3.0.0 updates the shape of alias records.
 * This script reshapes existing records for compatibility.
 *
 * By default, this script runs in the development stage.
 * To run in production, run this script with environment variable STAGE=prod.
 */

import { DynamoDB } from "aws-sdk";
import config from "../lib/config";

// SCRIPT CONFIGURATION
const REGION = ""; // Enter your DynamoDB table region here
// END SCRIPT CONFIGURATION

const client = new DynamoDB.DocumentClient({ region: REGION });
const now = new Date();

const reshapeItem = async (item: any): Promise<void> => {
  const putParams: DynamoDB.DocumentClient.PutItemInput = {
    TableName: config.tableName,
    Item: {
      alias: item.alias,
      description: item.description,
      creationDate: now.getTime(),
      countReceived: 0,
      countSent: 0,
      lastReceivedDate: undefined,
      lastSentDate: undefined
    }
  };

  console.log(`Reshaping alias record of alias value=${item.alias}`);
  await client.put(putParams).promise();
  console.log("Reshaping successful");
};

const main = async (): Promise<void> => {
  if (REGION === "") {
    console.error("Set REGION script configuration variable first");
    return;
  }

  const scanParams: DynamoDB.DocumentClient.ScanInput = {
    TableName: config.tableName
  };

  console.log("Scanning table");
  const scanResults: DynamoDB.DocumentClient.ScanOutput = await client
    .scan(scanParams)
    .promise();
  console.log("Scan complete");

  if (scanResults.Items === undefined) {
    console.error("Items property missing in table scan results");
    return;
  }

  scanResults.Items.forEach(async item => await reshapeItem(item));
};

console.log("Starting script");

main()
  .then(() => console.log("Script completed"))
  .catch(err => console.error(`Error while running script: ${err}`));
