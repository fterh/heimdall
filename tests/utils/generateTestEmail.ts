const emlformat = require("eml-format");
import { ParsedMail, simpleParser } from "mailparser";

interface Email {
  name?: string;
  email: string;
}

export interface EMLFormatDataAttachment {
  cid?: string;
  contentType?: string;
  data: string | Buffer;
  filename?: string;
  inline?: boolean; // Set to false for attachments
  name?: string;
}

export interface EMLFormatData {
  from?: Email | string;
  to: Email | Array<Email> | string | Array<string>;
  cc?: Email | Array<Email> | string | Array<string>;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<EMLFormatDataAttachment>;
}

export default async (
  data: EMLFormatData,
  messageId: string | undefined = undefined,
  references: Array<string> | undefined = undefined
): Promise<ParsedMail> => {
  let testEml = "";
  emlformat.build(data, (err: Error | null, eml: string) => {
    if (err) return console.error(err);
    testEml = eml;
  });

  const testEmail = await simpleParser(testEml);
  testEmail.messageId = messageId;
  testEmail.references = references;

  return testEmail;
};
