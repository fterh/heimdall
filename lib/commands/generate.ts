import { DynamoDB } from "aws-sdk";
import { ParsedMail } from "mailparser";
import aliasExists from "../aliasExists";
import { email, operationalDomain } from "../env";
import { Commands } from "../commandSet";
import generateAlias from "../generateAlias";
import sendEmail from "../sendEmail";
import storeAliasDescriptionRecord from "../storeAliasDescriptionRecord";

export default async (parsedMail: ParsedMail): Promise<void> => {
  const docClient = new DynamoDB.DocumentClient(); // Avoid re-initializing

  const description = parsedMail.subject;

  let generatedAlias: string;
  do {
    generatedAlias = generateAlias();
  } while (await aliasExists(generatedAlias, docClient));
  console.log(
    `Generated alias=${generatedAlias} for description=${description}`
  );

  console.log("Attempting to store alias-description record");
  storeAliasDescriptionRecord(generatedAlias, description, docClient);
  console.log("Successfully stored alias-description record");

  await sendEmail({
    from: `${Commands.Generate}@${operationalDomain}`,
    to: [email],
    subject: `Generated alias: ${generatedAlias}`,
    text: `You have generated ${generatedAlias}@${operationalDomain} for "${description}".`
  });
};
