import path from "path";
import { DynamoDB } from "aws-sdk";
import * as AWSMock from "aws-sdk-mock";
import aliasExists from "../../lib/aliasExists";

type Callback = (err: any, data: any) => void;

beforeEach(() => {
  // Fix: https://github.com/dwyl/aws-sdk-mock/issues/145
  AWSMock.setSDK(path.resolve(__dirname, "../../node_modules/aws-sdk"));

  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "get",
    (params: any, callback: Callback) => {
      if (params.Key.alias === "existingalias") {
        callback(null, { Item: {} });
      } else {
        callback(null, {});
      }
    }
  );
});

afterEach(() => {
  AWSMock.restore();
});

it("should return true if alias exists in database", async () => {
  const docClient = new DynamoDB.DocumentClient();
  const res = await aliasExists("existingalias", docClient);
  expect(res).toBe(true);
});

it("should return false if alias does not exist in database", async () => {
  const docClient = new DynamoDB.DocumentClient();
  const res = await aliasExists("nonexistentalias", docClient);
  expect(res).toBe(false);
});
