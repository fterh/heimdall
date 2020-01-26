import { EmailAddress } from "mailparser";
import { domain } from "../../lib/env";
import sendEmail from "../../lib/utils/sendEmail";
import senderAddressEncodeDecode from "../../lib/utils/senderAddressEncodeDecode";
import forwardOutbound, {
  decomposeUnpureAlias,
  generateOriginalSenderEmailAddress
} from "../../lib/forwardOutbound";
import generateTestEmail from "../utils/generateTestEmail";

jest.mock("../../lib/utils/sendEmail");

const testAlias = "testAlias";
const aliasEmailAddress = `testAlias@${domain}`;
const senderEmailAddress = "originalsender@domain.com";

it("should send outbound email from alias to original sender", async () => {
  const testEmail = await generateTestEmail({
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
    html: "Test html\n"
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
    html: "Test html\n"
  });
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
