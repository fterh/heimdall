import { DynamoDB } from "aws-sdk";
import { ParsedMail } from "mailparser";

/**
 * Extracts and returns all aliases in the "to" and "cc" headers
 * in the email belonging to user's verified domain.
 */
export const extractEmailAliases = (parsed: ParsedMail): Array<string> => {
  const recipients = parsed.to.value.concat(parsed.cc ? parsed.cc.value : []);

  if (!process.env.DOMAIN) {
    throw new Error("DOMAIN environment variable is not set");
  }
  const domain = process.env.DOMAIN;

  return recipients
    .map(emailObject => emailObject.address)
    .filter(emailAddress => emailAddress.includes(`@${domain}`))
    .map(emailAddress => emailAddress.split("@")[0]);
};

export const getEmailSource = async (alias: string): Promise<string> => {
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
