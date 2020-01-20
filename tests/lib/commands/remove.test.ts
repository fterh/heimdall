import path from "path";
import * as AWSMock from "aws-sdk-mock";
import remove from "../../../lib/commands/remove";
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

it("should delete the provided alias", async () => {
  const mockDocumentClient = jest.fn();

  AWSMock.mock(
    "DynamoDB.DocumentClient",
    "delete",
    (params: any, callback: Callback) => {
      mockDocumentClient(params);
      callback(null, null);
    }
  );

  const testEmail = await generateTestEmail({
    to: [{ email: "test@domain.com" }],
    subject: "abandonedalias"
  });

  await remove(testEmail);

  expect(mockDocumentClient.mock.calls.length).toBe(1);
  expect(mockDocumentClient.mock.calls[0][0].Key).toStrictEqual({
    alias: "abandonedalias"
  });

  expect(sendResponse.default).toHaveBeenCalledTimes(1);
  expect(sendResponse.default).toHaveBeenCalledWith(
    `${Commands.Remove}@${domain}`,
    email,
    "Delete alias abandonedalias",
    "Deletion completed."
  );
});
