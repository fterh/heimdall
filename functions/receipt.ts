"use strict";

import { S3 } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { simpleParser } from "mailparser";

import forwardInbound from "../lib/forwardInbound";
import extractEmailAliases from "../lib/extractEmailAliases";
import handleCommand from "../lib/commands";
import reserved from "../lib/reserved";

const s3 = new S3({
  apiVersion: "2006-03-01",
  region: process.env.AWSREGION // TODO check if this should be AWS_REGION instead
});

export const handler = async (event: S3Event) => {
  console.log(
    `Received incoming email; object key = ${event.Records[0].s3.object.key}`
  );
  const record = event.Records[0];
  // Retrieve the email from your bucket
  const request = {
    Bucket: record.s3.bucket.name,
    Key: record.s3.object.key
  };

  try {
    const data = await s3.getObject(request).promise();
    const email = await simpleParser(data.Body as Buffer);
    const aliases = extractEmailAliases(email);

    // Command emails are handled separately.
    if (aliases.length == 1 && reserved.has(aliases[0])) {
      return await handleCommand(aliases[0], email);
    }

    await Promise.all(aliases.map(alias => forwardInbound(alias, email)));
  } catch (Error) {
    console.error(Error, Error.stack);
    return Error;
  }
};
