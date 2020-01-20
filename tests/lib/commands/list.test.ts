import path from "path";
import * as AWSMock from "aws-sdk-mock";
import { DynamoDB } from "aws-sdk";
import list from "../../../lib/commands/list";

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
  const mockSES = jest.fn();

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

  AWSMock.mock("SESV2", "sendEmail", (params: any, callback: Callback) => {
    mockSES(params);
    callback(null, null);
  });

  await list();

  expect(mockDocumentClient.mock.calls.length).toBe(1);

  expect(mockSES.mock.calls.length).toBe(1);
  expect(mockSES.mock.calls[0][0].Content.Simple.Subject.Data).toContain(
    "Alias list"
  );
  expect(mockSES.mock.calls[0][0].Content.Simple.Body.Text.Data).toBe(
    "Alias : Source\nalias1 : source1\nalias2 : source2\nalias3 : source3\n"
  );
});

it("should send a response email indicating no records found", async () => {
  const mockSES = jest.fn();

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

  AWSMock.mock("SESV2", "sendEmail", (params: any, callback: Callback) => {
    mockSES(params);
    callback(null, null);
  });

  await list();

  expect(mockSES.mock.calls[0][0].Content.Simple.Subject.Data).toContain(
    "Alias list"
  );
  expect(mockSES.mock.calls[0][0].Content.Simple.Body.Text.Data).toBe(
    "No aliases found."
  );
});

it("should notify user that there might be missing records", async () => {
  const mockSES = jest.fn();

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

  AWSMock.mock("SESV2", "sendEmail", (params: any, callback: Callback) => {
    mockSES(params);
    callback(null, null);
  });

  await list();

  expect(mockSES.mock.calls[0][0].Content.Simple.Body.Text.Data).toContain(
    "There might be more records in the results set. Check the logs and database for more information."
  );
});

it("should notify user that there is malformed data", async () => {
  const mockSES = jest.fn();

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

  AWSMock.mock("SESV2", "sendEmail", (params: any, callback: Callback) => {
    mockSES(params);
    callback(null, null);
  });

  await list();

  expect(mockSES.mock.calls[0][0].Content.Simple.Body.Text.Data).toContain(
    "The database contains malformed records. Check the logs and database for more information."
  );
});
