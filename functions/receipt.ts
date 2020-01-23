"use strict";

import { S3 } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { simpleParser, ParsedMail } from "mailparser";

import forwardIOB from "../lib/forwardInboundOrOutbound";
import extractEmailAliases from "../lib/extractEmailAliases";
import handleCommand from "../lib/commands";
import reserved from "../lib/reserved";

const s3 = new S3({
  apiVersion: "2006-03-01",
  region: process.env.AWSREGION // TODO check if this should be AWS_REGION instead
});

// Refactor for saner testing
export const handleAliases = async (
  aliases: Array<string>,
  parsedEmail: ParsedMail
): Promise<void> => {
  // Handle commands separately
  if (aliases.length == 1 && reserved.has(aliases[0])) {
    return await handleCommand(aliases[0], parsedEmail);
  }

  await Promise.all(aliases.map(alias => forwardIOB(alias, parsedEmail)));
};

export const handler = async (event: S3Event) => {
  console.log(`Received incoming email; key=${event.Records[0].s3.object.key}`);

  const record = event.Records[0];
  const request = {
    Bucket: record.s3.bucket.name,
    Key: record.s3.object.key
  };

  try {
    const data = (await s3.getObject(request).promise()).Body as Buffer;
    const email = await simpleParser(data);
    const aliases = extractEmailAliases(email);

    await handleAliases(aliases, email);
  } catch (Error) {
    console.error(Error, Error.stack);
    return Error;
  }
};
