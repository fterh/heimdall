import addrs from "email-addresses";
import { ParsedMail } from "mailparser";
import { domain } from "./env";

/**
 * Extracts and returns all aliases in the "to" and "cc" headers
 * in the email belonging to user's verified domain.
 */
export default (parsed: ParsedMail): Array<string> => {
  const recipients = parsed.to.value.concat(parsed.cc ? parsed.cc.value : []);

  return recipients
    .map(emailObject => emailObject.address)
    .filter(emailAddress => emailAddress.includes(`@${domain}`))
    .map(emailAddress => {
      const parsed = addrs.parseOneAddress(emailAddress) as addrs.ParsedMailbox;
      return parsed.local;
    });
};
