import { email as myEmail, domain } from "../../lib/env";
import forwardInbound, {
  generateReplyTo,
  repackageSenderEmailAddress
} from "../../lib/forwardInbound";
import * as getEmailSource from "../../lib/getEmailSource";
import sendEmail from "../../lib/utils/sendEmail";
import senderAddressEncodeDecode from "../../lib/utils/senderAddressEncodeDecode";
import generateTestEmail, { EMLFormatData } from "../utils/generateTestEmail";

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

// This is a general integration test of the entire module
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
    from: aliasEmail,
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

it(`should generate a "reply-to" header using the "from" header`, async () => {
  const testEmail = await generateTestEmail(testEmailData1);
  const res = generateReplyTo(testAlias, testEmail);
  expect(res).toStrictEqual({
    name: "sender@domain.com",
    address: senderAddressEncodeDecode.encodeEmailAddress(
      testAlias,
      "sender@domain.com"
    )
  });
});

it(`should prioritize the "reply-to" header over the "from" header`, async () => {
  const testEmail = await generateTestEmail(testEmailData1);
  // Hackish way to insert "reply-to" header information
  testEmail.replyTo = {
    text: "",
    html: "",
    value: [
      {
        address: "someoneelse@domain.com",
        name: "Someone Else"
      }
    ]
  };
  const res = generateReplyTo(testAlias, testEmail);
  expect(res).toStrictEqual({
    name: "someoneelse@domain.com",
    address: senderAddressEncodeDecode.encodeEmailAddress(
      testAlias,
      "someoneelse@domain.com"
    )
  });
});

it("should repackage original sender's name and email into current sender's email address", () => {
  const repackaged = repackageSenderEmailAddress(testAlias, [
    { name: "John Smith", address: "johnsmith@domain.com" }
  ]);

  expect(repackaged).toStrictEqual({
    name: "John Smith <johnsmith@domain.com>",
    address: aliasEmail
  });
});
