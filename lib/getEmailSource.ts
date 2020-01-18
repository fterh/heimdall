import { DynamoDB } from "aws-sdk";

export default async (alias: string): Promise<string> => {
  const docClient = new DynamoDB.DocumentClient();

  const params: DynamoDB.DocumentClient.GetItemInput = {
    TableName: "aliases",
    Key: {
      alias: alias
    }
  };

  try {
    const res = await docClient.get(params).promise();
    if (!res.Item) {
      throw new Error(`Alias=${alias} not found in database!`);
    }

    if (!res.Item.source) {
      throw new Error(`Alias=${alias} does not have a "source" attribute!`);
    }
    return res.Item.source as string;
  } catch (err) {
    throw err;
  }
};
