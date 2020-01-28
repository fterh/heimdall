"use strict";

import { S3 } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { simpleParser } from "mailparser";
import extractEmailAliases from "../lib/extractEmailAliases";
import processAliases from "../lib/processAliases";

export const handler = async (event: S3Event) => {
  console.log(`Received incoming email; key=${event.Records[0].s3.object.key}`);

  const s3 = new S3({
    apiVersion: "2006-03-01",
    region: process.env.AWSREGION // TODO check if this should be AWS_REGION instead
  });

  const record = event.Records[0];
  const request = {
    Bucket: record.s3.bucket.name,
    Key: record.s3.object.key
  };

  try {
    const data = (await s3.getObject(request).promise()).Body as Buffer;
    const email = await simpleParser(data);
    const aliases = extractEmailAliases(email);
    await processAliases(aliases, email);

    // Delete the email from S3 only after successfully processing it
    console.log("Deleting email from S3 storage");
    await s3.deleteObject(request).promise();
    console.log("Deleted email from S3 storage");
  } catch (err) {
    console.error(err);
    return err;
  }
};
