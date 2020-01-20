import { ParsedMail } from "mailparser";

import generate from "./generate";
import list from "./list";
import remove from "./remove";
import reserved, { Commands } from "../reserved";

export default async (command: string, parsedMail: ParsedMail) => {
  if (!reserved.has(command)) {
    throw new Error(`"${command}" is not a command`);
  }

  try {
    switch (command) {
      case Commands.Generate:
        await generate(parsedMail);
        break;

      case Commands.List:
        await list();
        break;

      case Commands.Remove:
        await remove();
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`An error occurred: ${err}`);
  }
};
