import path from "path";
import * as AWSMock from "aws-sdk-mock";
import { DynamoDB } from "aws-sdk";
import list from "../../../lib/commands/list";
import sendEmail from "../../../lib/utils/sendEmail";
import { domain, email } from "../../../lib/env";
import { Commands } from "../../../lib/reserved";

jest.mock("../../../lib/utils/sendEmail");

type Callback = (err: any, data: any) => void;

beforeEach(() => {
  // Fix: https://github.com/dwyl/aws-sdk-mock/issues/145
  AWSMock.setSDK(path.resolve(__dirname, "../../../node_modules/aws-sdk"));
});

afterEach(() => {
  AWSMock.restore();
});

it("should send a response email with a list of alias-description records", async () => {
  const mockDocumentClient = jest.fn();

  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "scan",
    (params: any, callback: Callback) => {
      mockDocumentClient(params);
      const records: DynamoDB.DocumentClient.ScanOutput = {
        Items: [
          {
            alias: "alias1",
            description: "description1"
          },
          {
            alias: "alias2",
            description: "description2"
          },
          {
            alias: "alias3",
            description: "description3"
          }
        ]
      };
      callback(null, records);
    }
  );

  await list();

  expect(mockDocumentClient.mock.calls.length).toBe(1);

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect((sendEmail as jest.Mock).mock.calls[0][0].from).toBe(
    `${Commands.List}@${domain}`
  );
  expect((sendEmail as jest.Mock).mock.calls[0][0].to).toStrictEqual([email]);
  expect((sendEmail as jest.Mock).mock.calls[0][0].subject).toContain(
    "Alias list"
  );
  expect((sendEmail as jest.Mock).mock.calls[0][0].text).toBe(
    "Alias : Description\nalias1 : description1\nalias2 : description2\nalias3 : description3\n"
  );
});

it("should send a response email indicating no records found", async () => {
  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "scan",
    (params: any, callback: Callback) => {
      const records: DynamoDB.DocumentClient.ScanOutput = {
        Items: []
      };
      callback(null, records);
    }
  );

  await list();

  expect((sendEmail as jest.Mock).mock.calls[0][0].text).toBe(
    "No aliases found."
  );
});

it("should notify user that there might be missing records", async () => {
  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "scan",
    (params: any, callback: Callback) => {
      const records: DynamoDB.DocumentClient.ScanOutput = {
        Items: [
          {
            alias: "alias1",
            description: "description1"
          },
          {
            alias: "alias2",
            description: "description2"
          },
          {
            alias: "alias3",
            description: "description3"
          }
        ],
        LastEvaluatedKey: {
          alias: "alias3",
          description: "description3"
        }
      };
      callback(null, records);
    }
  );

  await list();

  expect((sendEmail as jest.Mock).mock.calls[0][0].text).toContain(
    "There might be more records in the results set. Check the logs and database for more information."
  );
});

it("should notify user that there is malformed data", async () => {
  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "scan",
    (params: any, callback: Callback) => {
      const records: DynamoDB.DocumentClient.ScanOutput = {
        Items: [
          {
            alias: "alias1",
            description: "description1"
          },
          {
            alias: "alias2"
          },
          {
            alias: "alias3",
            description: "description3"
          }
        ],
        LastEvaluatedKey: {
          alias: "alias3",
          description: "description3"
        }
      };
      callback(null, records);
    }
  );

  await list();

  expect((sendEmail as jest.Mock).mock.calls[0][0].text).toContain(
    "The database contains malformed records. Check the logs and database for more information."
  );
});
