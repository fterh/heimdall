import { EmailAddress } from "mailparser";
import { operationalDomain } from "../../lib/env";
import sendEmail from "../../lib/utils/sendEmail";
import senderAddressEncodeDecode from "../../lib/utils/senderAddressEncodeDecode";
import forwardOutbound, {
  decomposeUnpureAlias,
  generateOriginalSenderEmailAddress
} from "../../lib/forwardOutbound";
import assertEquivalentAttachments from "../utils/assertEquivalentAttachments";
import generateTestEmail, { EMLFormatData } from "../utils/generateTestEmail";

jest.mock("../../lib/utils/sendEmail");

const testAlias = "testAlias";
const aliasEmailAddress = `testAlias@${operationalDomain}`;
const senderEmailAddress = "originalsender@domain.com";

const testAttachment = {
  data: "attachment_data_as_string"
};

const testEmailData1: EMLFormatData = {
  from: "personalemail@personaldomain.com",
  to: {
    name: `Original Sender <${senderEmailAddress}>`,
    email: senderAddressEncodeDecode.encodeEmailAddress(
      testAlias,
      senderEmailAddress
    )
  },
  subject: "Test subject",
  html: "Test html"
};

const testEmailData2: EMLFormatData = Object.assign({}, testEmailData1);
testEmailData2.attachments = [testAttachment];

it("should send outbound email from alias to original sender", async () => {
  const testEmail = await generateTestEmail(testEmailData1);

  await forwardOutbound(
    senderAddressEncodeDecode.encodeUnpureAlias(testAlias, senderEmailAddress),
    testEmail
  );

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(sendEmail).toHaveBeenCalledWith({
    from: aliasEmailAddress,
    to: {
      name: "",
      address: senderEmailAddress
    },
    cc: undefined,
    subject: "Test subject",
    html: "Test html\n",
    attachments: []
  });
});

it("should throw if original sender address is missing", () => {
  expect(() => {
    decomposeUnpureAlias(
      senderAddressEncodeDecode.encodeUnpureAlias("testAlias", "")
    );
  }).toThrow(
    new Error(
      "Original sender address not found. This could happen when sending an email directly to alias."
    )
  );
});

it("should only generate original sender's email address", () => {
  const emails: Array<EmailAddress> = [
    { name: "Recipient 1", address: "recipient1@domain.com" },
    { name: "Recipient 2", address: "recipient2@domain.com" },
    {
      name: `Original Sender <${senderEmailAddress}>`,
      address: senderAddressEncodeDecode.encodeEmailAddress(
        testAlias,
        senderEmailAddress
      )
    },
    { name: "Recipient 3", address: "recipient3@domain.com" }
  ];

  const generatedRecipient = generateOriginalSenderEmailAddress(
    senderAddressEncodeDecode.encodeUnpureAlias(testAlias, senderEmailAddress),
    emails
  );

  expect(generatedRecipient).toStrictEqual({
    name: "",
    address: senderEmailAddress
  });
});

it(`should discard all other recipients on the "to" and "cc" header lists`, async () => {
  const testEmail = await generateTestEmail({
    from: "personalemail@personaldomain.com",
    to: [
      {
        name: `Original Sender <${senderEmailAddress}>`,
        email: senderAddressEncodeDecode.encodeEmailAddress(
          testAlias,
          senderEmailAddress
        )
      },
      {
        name: "Someone Else",
        email: "someoneelse@someotherdomain.com"
      }
    ],
    cc: [
      "ccrecipient1@someotherdomain.com",
      "ccrecipient2@someotherdomain.com"
    ],
    subject: "Test subject",
    html: "Test html"
  });

  await forwardOutbound(
    senderAddressEncodeDecode.encodeUnpureAlias(testAlias, senderEmailAddress),
    testEmail
  );

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(sendEmail).toHaveBeenCalledWith({
    from: aliasEmailAddress,
    to: {
      name: "",
      address: senderEmailAddress
    },
    cc: undefined,
    subject: "Test subject",
    html: "Test html\n",
    attachments: []
  });
});

it("should forward attachments to original sender", async () => {
  const testEmail = await generateTestEmail(testEmailData2);

  await forwardOutbound(
    senderAddressEncodeDecode.encodeUnpureAlias(testAlias, senderEmailAddress),
    testEmail
  );

  const _sendEmail = sendEmail as jest.Mock<any, any>;
  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(_sendEmail.mock.calls[0][0].attachments.length).toBe(1);
  expect(
    assertEquivalentAttachments(
      testEmail.attachments![0],
      _sendEmail.mock.calls[0][0].attachments[0]
    )
  ).toBe(true);
});

/* Security-related tests */

// This happens when an email is sent to a properly-formatted
// unpure alias email address (through the SMTP envelope)
// but that address is absent in the "to" header list.
it(`should throw if alias is absent in the "to" recipients list`, () => {
  const emails: Array<EmailAddress> = [
    {
      name: "Original Sender <originalsender@outsidedomain.com>",
      address: senderAddressEncodeDecode.encodeEmailAddress(
        "testAlias2",
        senderEmailAddress
      )
    }
  ];

  expect(() => {
    generateOriginalSenderEmailAddress(
      senderAddressEncodeDecode.encodeEmailAddress(
        "testAlias",
        senderEmailAddress
      ),
      emails
    );
  }).toThrow(
    new Error(
      `Alias not detected among "to" email addresses; this should not happen.`
    )
  );
});
