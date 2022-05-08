import addrs from "email-addresses";
import { ParsedMail } from "mailparser";
import { operationalDomain } from "./env";

/**
 * Extracts and returns all aliases in the "to" and "cc" headers
 * in the email belonging to user's verified domain.
 */
export default (parsed: ParsedMail): Array<string> => {
  const recipients = parsed.to.value.concat(parsed.cc ? parsed.cc.value : []);

  return recipients
    .filter(emailObject => emailObject.address !== undefined)
    .map(emailObject => emailObject.address)
    .filter(emailAddress => emailAddress.includes(`@${operationalDomain}`))
    .map(emailAddress => {
      const parsed = addrs.parseOneAddress(emailAddress) as addrs.ParsedMailbox;
      return parsed.local;
    });
};
