const emlformat = require("eml-format");
import { ParsedMail, simpleParser } from "mailparser";

export default async (data: object): Promise<ParsedMail> => {
  let testEml = "";
  emlformat.build(data, (err: Error | null, eml: string) => {
    if (err) return console.error(err);
    testEml = eml;
  });

  return await simpleParser(testEml);
};
