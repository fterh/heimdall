import { Attachment as MailparserAttachment } from "mailparser";
import { Attachment as NodemailerAttachment } from "nodemailer/lib/mailer";

/**
 * Repackages an array of received attachments for sending.
 *
 * Received emails are parsed by mailparser,
 * while outgoing emails are sent by nodemailer.
 * There are some type incompatibilities with the
 * Attachment typedefs in these libraries,
 * which necessitates some hacks to work around.
 */
export default (
  inboundAttachments: Array<MailparserAttachment> | undefined
): Array<NodemailerAttachment> | undefined => {
  return inboundAttachments?.map(inboundAttachment => {
    return {
      filename: inboundAttachment.filename,
      cid: inboundAttachment.cid,
      contentType: inboundAttachment.contentType,
      contentDisposition: inboundAttachment.contentDisposition,
      // Hack to fix inaccurate (too wide) MailparserAttachment["headers"] typedefs
      headers:
        inboundAttachment.headers as unknown as NodemailerAttachment["headers"],
      content: inboundAttachment.content
    } as NodemailerAttachment;
  });
};
