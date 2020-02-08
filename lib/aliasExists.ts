import { DynamoDB } from "aws-sdk";
import config from "./config";

export default async (
  alias: string,
  client: DynamoDB.DocumentClient
): Promise<boolean> => {
  console.log(`Checking if alias=${alias} exists`);

  const params: DynamoDB.DocumentClient.GetItemInput = {
    TableName: config.tableName,
    Key: {
      alias
    }
  };

  const res = await client.get(params).promise();
  return !(res.Item === undefined);
};
