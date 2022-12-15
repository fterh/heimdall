import { ParsedMail } from "mailparser";
import { email, operationalDomain } from "../env";
import { Commands } from "../commandSet";
import Alias from "../models/Alias";
import generateReplyEmail from "../generateReplyEmail";
import sendEmail from "../sendEmail";

export default async (parsedMail: ParsedMail): Promise<void> => {
  const description = parsedMail.subject || "No description";
  const aliasValue = parsedMail.text;

  try {
    const alias = await Alias.generateAlias({ aliasValue, description });
    console.log(alias)
    await sendEmail(
      generateReplyEmail(
        {
          from: {
            name: "Generate",
            address: `${Commands.Generate}@${operationalDomain}`
          },
          to: [email],
          subject: parsedMail.subject,
          text: `You have generated ${alias.value}@${operationalDomain} for "${alias.description}".`
        },
        parsedMail
      )
    );
  } catch (e) {
    await sendEmail(
      generateReplyEmail(
        {
          from: {
            name: "Generate",
            address: `${Commands.Generate}@${operationalDomain}`
          },
          to: [email],
          subject: parsedMail.subject,
          text: `Error generating alias: ${e.message}`
        },
        parsedMail
      )
    );
    return;
  }


};
