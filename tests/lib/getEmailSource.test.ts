import path from "path";
import * as AWSMock from "aws-sdk-mock";
import getEmailSource from "../../lib/getEmailSource";

type Callback = (err: any, data: any) => void;

beforeEach(() => {
  // Fix: https://github.com/dwyl/aws-sdk-mock/issues/145
  AWSMock.setSDK(path.resolve(__dirname, "../../node_modules/aws-sdk"));
});

afterEach(() => {
  AWSMock.restore("DynamoDB.DocumentClient");
});

it("should return the source for a valid alias", async () => {
  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "get",
    (params: any, callback: Callback) => {
      callback(null, { Item: { alias: "alias1", source: "source1" } });
    }
  );

  await expect(getEmailSource("alias1")).resolves.toBe("source1");
});

it("should throw an error if alias doesn't exist", async () => {
  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "get",
    (params: any, callback: Callback) => {
      callback(null, {});
    }
  );

  await expect(getEmailSource("alias2")).rejects.toThrow(
    "Alias=alias2 not found in database!"
  );
});

it("should throw an error if the document has no `source` attribute", async () => {
  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "get",
    (params: any, callback: Callback) => {
      callback(null, { Item: { alias: "alias1" } });
    }
  );

  await expect(getEmailSource("alias1")).rejects.toThrow(
    'Alias=alias1 does not have a "source" attribute'
  );
});
