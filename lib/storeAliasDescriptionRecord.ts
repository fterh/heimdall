import { DynamoDB } from "aws-sdk";
import config from "./config";

export default async (
  alias: string,
  description: string,
  client: DynamoDB.DocumentClient
): Promise<void> => {
  const docParams: DynamoDB.DocumentClient.PutItemInput = {
    TableName: config.tableName,
    Item: {
      alias: alias,
      description
    }
  };

  await client.put(docParams).promise();
};
