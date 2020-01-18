"use strict";

import { S3 } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { simpleParser } from "mailparser";

import forwardInbound from "./forwardInbound";
import { extractEmailAliases } from "./utils";

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

    await Promise.all(aliases.map(alias => forwardInbound(alias, email)));
  } catch (Error) {
    console.error(Error, Error.stack);
    return Error;
  }
};
