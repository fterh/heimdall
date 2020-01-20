import path from "path";
import * as AWSMock from "aws-sdk-mock";
import { domain } from "../../../lib/env";
import generate from "../../../lib/commands/generate";
import generateTestEmail from "../../utils/generateTestEmail";

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
  const mockSES = jest.fn();

  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "put",
    (params: any, callback: Callback) => {
      mockDocumentClient(params);
      callback(null, null);
    }
  );

  AWSMock.mock("SESV2", "sendEmail", (params: any, callback: Callback) => {
    mockSES(params);
    callback(null, null);
  });

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

  expect(mockSES.mock.calls.length).toBe(1);
  expect(mockSES.mock.calls[0][0].Content.Simple.Subject.Data).toBe(
    "Generated alias: fakeid"
  );
  expect(mockSES.mock.calls[0][0].Content.Simple.Body.Text.Data).toBe(
    `You have generated fakeid@${domain} for "Some source".`
  );
});
