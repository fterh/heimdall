import * as AWSMock from "aws-sdk-mock";
import remove from "../../../lib/commands/remove";
import sendEmail from "../../../lib/sendEmail";
import { email, operationalDomain } from "../../../lib/env";
import { Commands } from "../../../lib/commandSet";
import generateTestEmail from "../../utils/generateTestEmail";

jest.mock("../../../lib/sendEmail");

type Callback = (err: any, data: any) => void;

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

  const testEmail = await generateTestEmail(
    {
      to: [{ email: "test@domain.com" }],
      subject: "abandonedalias"
    },
    "messageId"
  );

  await remove(testEmail);

  expect(mockDocumentClient.mock.calls.length).toBe(1);
  expect(mockDocumentClient.mock.calls[0][0].Key).toStrictEqual({
    alias: "abandonedalias"
  });

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(sendEmail).toHaveBeenCalledWith({
    from: {
      name: "Remove",
      address: `${Commands.Remove}@${operationalDomain}`
    },
    to: [email],
    inReplyTo: "messageId",
    references: ["messageId"],
    subject: "abandonedalias",
    text: "Deletion completed."
  });
});
