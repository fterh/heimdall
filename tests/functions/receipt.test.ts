import path from "path";
import { S3EventRecord } from "aws-lambda";
import * as AWSMock from "aws-sdk-mock";
import { handler } from "../../functions/receipt";

type Callback = (err: any, data: any) => void;

jest.mock("mailparser", () => {
  return {
    simpleParser: () => {
      return {};
    }
  };
});
jest.mock("../../lib/commands");
jest.mock("../../lib/extractEmailAliases");
jest.mock("../../lib/forwardInboundOrOutbound");

beforeEach(() => {
  // Fix: https://github.com/dwyl/aws-sdk-mock/issues/145
  AWSMock.setSDK(path.resolve(__dirname, "../../node_modules/aws-sdk"));
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
  const spy = jest.fn();
  AWSMock.mock("S3", "getObject", { Body: Buffer.from("test data") });
  AWSMock.mock("S3", "deleteObject", (params: any, callback: Callback) => {
    spy();
    callback(null, null);
  });

  await handler({ Records: [testS3EventRecord] });
  expect(spy).toHaveBeenCalledTimes(1);
});
