const emlformat = require("eml-format");
import { ParsedMail, simpleParser } from "mailparser";

interface Email {
  name?: string;
  email: string;
}

export interface EMLFormatData {
  from?: Email | string;
  to: Email | Array<Email> | string | Array<string>;
  cc?: Email | Array<Email> | string | Array<string>;
  subject?: string;
  text?: string;
  html?: string;
}

export default async (data: EMLFormatData): Promise<ParsedMail> => {
  let testEml = "";
  emlformat.build(data, (err: Error | null, eml: string) => {
    if (err) return console.error(err);
    testEml = eml;
  });

  return await simpleParser(testEml);
};
