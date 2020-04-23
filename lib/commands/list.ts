import { ParsedMail } from "mailparser";
import { email, operationalDomain } from "../env";
import { Commands } from "../commandSet";
import Alias from "../models/Alias";
import generateReplyEmail from "../generateReplyEmail";
import sendEmail from "../sendEmail";

export default async (parsedMail: ParsedMail): Promise<void> => {
  const getAliasesResults = await Alias.getAllAliases();

  if (getAliasesResults.aliases.length === 0) {
    await sendEmail({
      from: `${Commands.List}@${operationalDomain}`,
      to: [email],
      subject: `Alias list (generated on: ${new Date()})`,
      text: "No aliases found."
    });
    return;
  }

  let output = "Alias : Description\n";
  getAliasesResults.aliases.forEach(alias => {
    output += `${alias.value} : ${alias.description}\n`;
  });

  if (getAliasesResults.lastEvaluatedKey !== undefined) {
    output +=
      "There might be more records in the results set. Check the logs and database for more information.";
  }

  await sendEmail(
    generateReplyEmail(
      {
        from: {
          name: "List",
          address: `${Commands.List}@${operationalDomain}`
        },
        to: [email],
        subject: parsedMail.subject,
        text: output
      },
      parsedMail
    )
  );
};
