import { ParsedMail } from "mailparser";
import { email, operationalDomain } from "../env";
import { Commands } from "../commandSet";
import Alias from "../models/Alias";
import generateReplyEmail from "../generateReplyEmail";
import sendEmail from "../sendEmail";

export default async (parsedMail: ParsedMail): Promise<void> => {
  const description = parsedMail.text || "No description";

  let subject = parsedMail.subject;
  let aliasValue: string;
  let aliasEmail: string | undefined = undefined;
  if (subject) {
    if (subject.includes(':')) {
      [aliasValue, aliasEmail] = subject.split(':');
    } else {
      aliasValue = subject;
    }
    if (await Alias.aliasExists(aliasValue)) {
      await sendEmail(
        generateReplyEmail(
          {
            from: {
              name: "Generate",
              address: `${Commands.Generate}@${operationalDomain}`
            },
            to: [email],
            subject: `Failed to create ${parsedMail.subject}. Alias already exists`,
            text: `Try a different alias or use the already created alias.`
          },
          parsedMail
        )
      );
      return;
    }
  } else {
    aliasValue = await Alias.generateUniqueAlias();
  }

  const alias = await Alias.generateAlias({ aliasValue, email: aliasEmail, description });

  await sendEmail(
    generateReplyEmail(
      {
        from: {
          name: "Generate",
          address: `${Commands.Generate}@${operationalDomain}`
        },
        to: [email],
        subject: parsedMail.subject,
        text: `You have generated ${alias.value}@${operationalDomain} ${alias.email} for "${alias.description}".`
      },
      parsedMail
    )
  );
};
