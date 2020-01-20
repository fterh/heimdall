import path from "path";
import * as AWSMock from "aws-sdk-mock";
import { DynamoDB } from "aws-sdk";
import list from "../../../lib/commands/list";
import * as sendResponse from "../../../lib/commands/sendResponse";
import { domain, email } from "../../../lib/env";
import { Commands } from "../../../lib/reserved";

jest.mock("../../../lib/commands/sendResponse");

type Callback = (err: any, data: any) => void;

beforeEach(() => {
  // Fix: https://github.com/dwyl/aws-sdk-mock/issues/145
  AWSMock.setSDK(path.resolve(__dirname, "../../../node_modules/aws-sdk"));
});

afterEach(() => {
  AWSMock.restore();
});

it("should send a response email with a list of alias-source records", async () => {
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
            source: "source1"
          },
          {
            alias: "alias2",
            source: "source2"
          },
          {
            alias: "alias3",
            source: "source3"
          }
        ]
      };
      callback(null, records);
    }
  );

  await list();

  expect(mockDocumentClient.mock.calls.length).toBe(1);

  expect(sendResponse.default).toHaveBeenCalledTimes(1);
  expect((sendResponse.default as jest.Mock).mock.calls[0][0]).toBe(
    `${Commands.List}@${domain}`
  );
  expect((sendResponse.default as jest.Mock).mock.calls[0][1]).toBe(email);
  expect((sendResponse.default as jest.Mock).mock.calls[0][2]).toContain(
    "Alias list"
  );
  expect((sendResponse.default as jest.Mock).mock.calls[0][3]).toBe(
    "Alias : Source\nalias1 : source1\nalias2 : source2\nalias3 : source3\n"
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

  expect((sendResponse.default as jest.Mock).mock.calls[0][3]).toBe(
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
            source: "source1"
          },
          {
            alias: "alias2",
            source: "source2"
          },
          {
            alias: "alias3",
            source: "source3"
          }
        ],
        LastEvaluatedKey: {
          alias: "alias3",
          source: "source3"
        }
      };
      callback(null, records);
    }
  );

  await list();

  expect((sendResponse.default as jest.Mock).mock.calls[0][3]).toContain(
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
            source: "source1"
          },
          {
            alias: "alias2"
          },
          {
            alias: "alias3",
            source: "source3"
          }
        ],
        LastEvaluatedKey: {
          alias: "alias3",
          source: "source3"
        }
      };
      callback(null, records);
    }
  );

  await list();

  expect((sendResponse.default as jest.Mock).mock.calls[0][3]).toContain(
    "The database contains malformed records. Check the logs and database for more information."
  );
});
