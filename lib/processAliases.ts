import { ParsedMail } from "mailparser";
import forwardIOB from "./forwardInboundOrOutbound";
import handleCommand from "./commands";
import commandSet from "./commandSet";

export default async (
  aliases: Array<string>,
  parsedEmail: ParsedMail
): Promise<void> => {
  // Handle commands separately
  if (aliases.length === 1 && commandSet.has(aliases[0])) {
    return await handleCommand(aliases[0], parsedEmail);
  }

  await Promise.all(aliases.map(alias => forwardIOB(alias, parsedEmail)));
};
