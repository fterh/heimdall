import generateReplyEmail from "../../lib/generateReplyEmail";
import generateTestEmail from "../utils/generateTestEmail";

const testEmailData = {
  from: "sender@domain.com",
  to: "recipient@domain.com"
};

it("should generate the In-Reply-To and References headers in response to a new email", async () => {
  const testEmail = await generateTestEmail(testEmailData, "messageId");
  const replyEmail = generateReplyEmail({}, testEmail);

  expect(replyEmail.inReplyTo).toBe("messageId");
  expect(replyEmail.references).toStrictEqual(["messageId"]);
});

it("should append the Message-ID to an existing References header", async () => {
  const testEmail = await generateTestEmail(testEmailData, "messageId", [
    "referencedMessageId"
  ]);
  const replyEmail = generateReplyEmail({}, testEmail);
  console.log(replyEmail);

  expect(replyEmail.inReplyTo).toBe("messageId");
  expect(replyEmail.references).toStrictEqual([
    "referencedMessageId",
    "messageId"
  ]);
});

it("should return gracefully if incoming email has no Message-ID header", async () => {
  const testEmail = await generateTestEmail(testEmailData);
  const replyEmail = generateReplyEmail({}, testEmail);

  expect(replyEmail).toStrictEqual({});
});
