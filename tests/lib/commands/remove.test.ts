import path from "path";
import * as AWSMock from "aws-sdk-mock";
import remove from "../../../lib/commands/remove";
import sendEmail from "../../../lib/sendEmail";
import { email, operationalDomain } from "../../../lib/env";
import { Commands } from "../../../lib/commandSet";
import generateTestEmail from "../../utils/generateTestEmail";

jest.mock("../../../lib/sendEmail");

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

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(sendEmail).toHaveBeenCalledWith({
    from: `${Commands.Remove}@${operationalDomain}`,
    to: [email],
    subject: "Delete alias abandonedalias",
    text: "Deletion completed."
  });
});
