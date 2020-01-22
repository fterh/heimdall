import { ParsedMail } from "mailparser";

import { email } from "../env";
import generate from "./generate";
import list from "./list";
import remove from "./remove";
import { Commands } from "../reserved";

export default async (command: string, parsedMail: ParsedMail) => {
  if (parsedMail.from.value[0].address !== email) {
    throw new Error(
      "Command email's sender is inconsistent with environment variable EMAIL."
    );
  }

  switch (command) {
    case Commands.Generate:
      console.log("Invoking generate command");
      await generate(parsedMail);
      break;

    case Commands.List:
      console.log("Invoking list command");
      await list();
      break;

    case Commands.Remove:
      await remove(parsedMail);
      break;

    default:
      // This should never happen
      throw new Error(`"${command}" is not a command`);
  }
};
