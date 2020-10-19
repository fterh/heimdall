import { S3EventRecord } from "aws-lambda";
import * as AWSMock from "aws-sdk-mock";
import { handler } from "../../functions/receipt";
import { email, operationalDomain } from "../../lib/env";
import processAliases from "../../lib/processAliases";
import sendEmail from "../../lib/sendEmail";

type Callback = (err: any, data: any) => void;

jest.mock("mailparser", () => {
  return {
    simpleParser: () => {
      return {};
    }
  };
});
jest.mock("../../lib/extractEmailAliases");
jest.mock("../../lib/processAliases");
jest.mock("../../lib/sendEmail");

const _processAliases = processAliases as jest.Mock;
const _sendEmail = sendEmail as jest.Mock;

const deleteObjectSpy = jest.fn();

beforeEach(() => {
  AWSMock.mock("S3", "getObject", { Body: Buffer.from("test data") });
  AWSMock.mock("S3", "deleteObject", (params: any, callback: Callback) => {
    deleteObjectSpy();
    callback(null, null);
  });
});

afterEach(() => {
  AWSMock.restore();
});

const testS3EventRecord: S3EventRecord = {
  eventVersion: "string",
  eventSource: "string",
  awsRegion: "string",
  eventTime: "string",
  eventName: "string",
  userIdentity: {
    principalId: "string"
  },
  requestParameters: {
    sourceIPAddress: "string"
  },
  responseElements: {
    "x-amz-request-id": "string",
    "x-amz-id-2": "string"
  },
  s3: {
    s3SchemaVersion: "string",
    configurationId: "string",
    bucket: {
      name: "string",
      ownerIdentity: {
        principalId: "string"
      },
      arn: "string"
    },
    object: {
      key: "string",
      size: 1,
      eTag: "string",
      versionId: "string",
      sequencer: "string"
    }
  }
};

it("should delete the email after successfully processing it", async () => {
  await handler({ Records: [testS3EventRecord] });

  expect(deleteObjectSpy).toHaveBeenCalledTimes(1);
});

it("should not delete the email and also notify the user in the event of errors", async () => {
  _processAliases.mockImplementation(async () => {
    throw new Error();
  });

  await handler({ Records: [testS3EventRecord] });

  expect(deleteObjectSpy).not.toBeCalled();
  expect(_sendEmail).toHaveBeenCalledTimes(1);
  expect(_sendEmail.mock.calls[0][0].from).toBe(
    `heimdall@${operationalDomain}`
  );
  expect(_sendEmail.mock.calls[0][0].to).toBe(email);
  expect(_sendEmail.mock.calls[0][0].subject).toBe(
    "Oops, something went wrong!"
  );
  expect(_sendEmail.mock.calls[0][0].text).toContain("An error has occurred:");
});
