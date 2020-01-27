import { DynamoDB } from "aws-sdk";

export default async (alias: string): Promise<string> => {
  const docClient = new DynamoDB.DocumentClient();
  const params: DynamoDB.DocumentClient.GetItemInput = {
    TableName: "aliases",
    Key: {
      alias: alias
    }
  };

  const res = await docClient.get(params).promise();

  if (!res.Item) {
    throw new Error(`Alias=${alias} not found in database!`);
  }

  if (!res.Item.description) {
    throw new Error(`Alias=${alias} does not have a "description" attribute!`);
  }

  return res.Item.description as string;
};
