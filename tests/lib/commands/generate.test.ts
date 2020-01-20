import path from "path";
import * as AWSMock from "aws-sdk-mock";
import generate from "../../../lib/commands/generate";
import * as sendResponse from "../../../lib/commands/sendResponse";
import { domain, email } from "../../../lib/env";
import { Commands } from "../../../lib/reserved";
import generateTestEmail from "../../utils/generateTestEmail";

jest.mock("../../../lib/commands/sendResponse");

type Callback = (err: any, data: any) => void;

beforeEach(() => {
  // Fix: https://github.com/dwyl/aws-sdk-mock/issues/145
  AWSMock.setSDK(path.resolve(__dirname, "../../../node_modules/aws-sdk"));
});

afterEach(() => {
  AWSMock.restore();
});

it("should store the alias-source record and send a response email for a successful outcome", async () => {
  const mockDocumentClient = jest.fn();

  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "put",
    (params: any, callback: Callback) => {
      mockDocumentClient(params);
      callback(null, null);
    }
  );

  const testEmail = await generateTestEmail({
    to: [{ email: "test@domain.com" }],
    subject: "Some source"
  });

  await generate(testEmail);

  expect(mockDocumentClient.mock.calls.length).toBe(1);
  expect(mockDocumentClient.mock.calls[0][0].Item).toStrictEqual({
    alias: "fakeid",
    source: "Some source"
  });

  expect(sendResponse.default).toHaveBeenCalledTimes(1);
  expect(sendResponse.default).toHaveBeenCalledWith(
    `${Commands.Generate}@${domain}`,
    email,
    "Generated alias: fakeid",
    `You have generated fakeid@${domain} for "Some source".`
  );
});
