import { email as myEmail, domain } from "../../lib/env";
import forwardInbound, {
  preprocessToAndCcRecipients,
  repackageSenderEmailAddress
} from "../../lib/forwardInbound";
import sendEmail from "../../lib/utils/sendEmail";
import generateTestEmail, { EMLFormatData } from "../utils/generateTestEmail";
import * as getEmailSource from "../../lib/getEmailSource";

jest.mock("../../lib/utils/sendEmail");
jest
  .spyOn(getEmailSource, "default")
  .mockImplementation(async () => "test source");

const testAlias = "testAlias";
const aliasEmail = `${testAlias}@${domain}`;

const testEmailData1: EMLFormatData = {
  from: {
    name: "Sender Name",
    email: "sender@domain.com"
  },
  to: aliasEmail,
  cc: [
    {
      name: "Person 2",
      email: "person2@domain.com"
    }
  ],
  subject: "Test subject",
  html: "Test body text"
};

const testEmailData2: EMLFormatData = {
  from: {
    name: "Sender Name",
    email: "sender@domain.com"
  },
  to: {
    name: "Recipient Name",
    email: "notme@domain.com"
  },
  cc: aliasEmail,
  subject: "Test subject",
  html: "Test body text"
};

it("should forward received email to personal email address", async () => {
  const testEmail1 = await generateTestEmail(testEmailData1);
  const testEmail2 = await generateTestEmail(testEmailData2);
  const testEmail3 = await generateTestEmail({
    from: testEmailData1.from,
    to: "notouremail@someotherdomain.com",
    cc: "notouremail2@someotherdomain.com",
    subject: testEmailData1.subject,
    text: testEmailData1.text
  });

  const _sendEmail = sendEmail as jest.Mock<any, any>;
  const expectedEnvelope = {
    from: `${testAlias}@${domain}`,
    to: myEmail
  };

  await forwardInbound(testAlias, testEmail1);
  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(_sendEmail.mock.calls[0][0].envelope).toStrictEqual(expectedEnvelope);
  expect(_sendEmail.mock.calls[0][0].subject).toBe(
    "[Source: test source] Test subject"
  );

  await forwardInbound(testAlias, testEmail2);
  expect(sendEmail).toHaveBeenCalledTimes(2);
  expect(_sendEmail.mock.calls[1][0].envelope).toStrictEqual(expectedEnvelope);

  await forwardInbound(testAlias, testEmail3);
  expect(sendEmail).toHaveBeenCalledTimes(3);
  expect(_sendEmail.mock.calls[2][0].envelope).toStrictEqual(expectedEnvelope);
});

it(`should replace alias with personal email address in the "to" and "cc" headers`, async () => {
  let toRecipients, ccRecipients;

  const testEmail1 = await generateTestEmail(testEmailData1);
  [toRecipients, ccRecipients] = preprocessToAndCcRecipients(testEmail1);
  expect(toRecipients).toStrictEqual([{ name: "", address: aliasEmail }]);
  expect(ccRecipients).toStrictEqual([
    {
      name: "Person 2",
      address: "person2@domain.com"
    }
  ]);

  const testEmail2 = await generateTestEmail(testEmailData2);
  [toRecipients, ccRecipients] = preprocessToAndCcRecipients(testEmail2);
  expect(toRecipients).toStrictEqual([
    {
      name: "Recipient Name",
      address: "notme@domain.com"
    }
  ]);
  expect(ccRecipients).toStrictEqual([{ name: "", address: aliasEmail }]);
});

it("should repackage original sender's name and email into current sender's name", () => {
  const repackaged = repackageSenderEmailAddress(testAlias, [
    { name: "John Smith", address: "johnsmith@domain.com" }
  ]);

  expect(repackaged).toStrictEqual({
    name: "John Smith <johnsmith@domain.com>",
    address: aliasEmail
  });
});
