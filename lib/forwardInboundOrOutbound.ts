import { ParsedMail } from "mailparser";
import { email } from "./env";
import forwardInbound from "./forwardInbound";
import forwardOutbound from "./forwardOutbound";

/**
 * Determines if a received email should be
 * inbound-forwarded to personal email address,
 * or outbound-forwarded as a reply to the sender.
 *
 * Decision is based ONLY on the "from" email address.
 */
export default async (alias: string, parsedMail: ParsedMail): Promise<void> => {
  if (parsedMail.from.value[0].address === email) {
    await forwardOutbound(alias, parsedMail);
  } else {
    await forwardInbound(alias, parsedMail);
  }
};
