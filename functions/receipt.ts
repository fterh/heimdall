import { S3 } from "aws-sdk";
import { S3Event } from "aws-lambda";
import { simpleParser } from "mailparser";
import { email, operationalDomain } from "../lib/env";
import extractEmailAliases from "../lib/extractEmailAliases";
import processAliases from "../lib/processAliases";
import sendEmail from "../lib/sendEmail";

const getRecordData = async (
  request: S3.GetObjectRequest,
  s3: S3
): Promise<Buffer> => {
  console.log("Fetching email from S3 storage");
  return (await s3.getObject(request).promise()).Body as Buffer;
};

const deleteRecord = async (
  request: S3.DeleteObjectRequest,
  s3: S3
): Promise<void> => {
  console.log("Deleting email from S3 storage");
  await s3.deleteObject(request).promise();
  console.log("Deleted email from S3 storage");
};

const notifyUserOfError = async (err: any): Promise<void> => {
  if (err instanceof Error) {
    console.error(err, err.stack);
  } else {
    console.error(err);
  }

  await sendEmail({
    from: `heimdall@${operationalDomain}`,
    to: email,
    subject: "Oops, something went wrong!",
    text: `An error has occurred:\n\n${err}\n\nCheck the logs for more information.`
  });
};

export const handler = async (event: S3Event) => {
  const record = event.Records[0];
  console.log(`Received incoming email (key=${record.s3.object.key})`);

  const s3 = new S3();
  const request = {
    Bucket: record.s3.bucket.name,
    Key: record.s3.object.key
  };

  try {
    const data = await getRecordData(request, s3);
    const email = await simpleParser(data);
    const aliases = extractEmailAliases(email);
    await processAliases(aliases, email);

    await deleteRecord(request, s3);
  } catch (err) {
    await notifyUserOfError(err);
  }
};
