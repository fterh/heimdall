import { ParsedMail } from "mailparser";
import { Commands } from "../commandSet";
import { email, operationalDomain } from "../env";
import Alias from "../models/Alias";
import sendEmail from "../sendEmail";

const commandEmailAddress = `${Commands.Info}@${operationalDomain}`;

export const prepareAliasInfoText = (alias: Alias): string => {
  let res = "";

  res += `Alias: ${alias.value}@${operationalDomain}\n`;
  res += `Description: ${alias.description}\n`;
  res += `Created: ${alias.creationDate ? alias.creationDate : "Unknown"}\n`;
  res += `Emails received: ${alias.countReceived}\n`;
  res += `Emails sent: ${alias.countSent}\n`;
  res += `Email last received on: ${
    alias.lastReceivedDate ? alias.lastReceivedDate : "-"
  }\n`;
  res += `Email last sent on: ${
    alias.lastSentDate ? alias.lastSentDate : "-"
  }\n\n`;

  res += `Information generated on ${new Date()}`;

  return res;
};

export default async (parsedMail: ParsedMail): Promise<void> => {
  const aliasValue = parsedMail.subject;

  if (aliasValue === undefined) {
    throw new Error("Alias value (email subject) is undefined");
  }

  const alias = await Alias.getAlias(aliasValue);

  if (alias === undefined) {
    await sendEmail({
      from: commandEmailAddress,
      to: email,
      subject: `Info: ${aliasValue}@${operationalDomain} does not exist`,
      text: "-"
    });
    return;
  }

  await sendEmail({
    from: commandEmailAddress,
    to: email,
    subject: `Info: ${aliasValue}@${operationalDomain}`,
    text: prepareAliasInfoText(alias)
  });
};
