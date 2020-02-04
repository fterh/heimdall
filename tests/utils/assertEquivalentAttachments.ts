import equal from "fast-deep-equal";
import { Attachment as MailparserAttachment } from "mailparser";
import { Attachment as NodemailerAttachment } from "nodemailer/lib/mailer";

interface IndexedAny {
  [index: string]: any;
}

interface MailparserAttachmentIndexedAny
  extends IndexedAny,
    MailparserAttachment {}

/**
 * Test util to assert that two attachments are equivalent
 * by comparing essential properties.
 *
 * This is because received attachments contain some
 * extra non-essential properties that are absent in outgoing attachments.
 */
export default (
  receivedAttachment: MailparserAttachmentIndexedAny,
  outgoingAttachment: NodemailerAttachment
): boolean => {
  const essentialProperties = [
    "cid",
    "content",
    "contentDisposition",
    "contentType",
    "filename",
    "headers"
  ];

  const refinedReceivedAttachment = {} as IndexedAny;
  essentialProperties.forEach(property => {
    refinedReceivedAttachment[property] = receivedAttachment[property];
  });

  return equal(refinedReceivedAttachment, outgoingAttachment);
};
