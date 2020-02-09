import { Base64 } from "js-base64";
import addrs from "email-addresses";
import { operationalDomain } from "./env";

export interface DecodedSenderAddress {
  aliasValue: string;
  senderAddress: string;
}

/**
 * An abstraction to manage the encoding and decoding
 * of reply-to email addresses that encapsulate the
 * original sender's email address.
 */

const encodeUnpureAliasValue = (
  aliasValue: string,
  originalSenderAddress: string
): string => {
  const encodedSenderAddress = Base64.encode(originalSenderAddress);
  return `${aliasValue}+${encodedSenderAddress}`;
};

const encodeEmailAddress = (
  aliasValue: string,
  originalSenderAddress: string
): string => {
  return `${encodeUnpureAliasValue(
    aliasValue,
    originalSenderAddress
  )}@${operationalDomain}`;
};

const decodeUnpureAliasValue = (
  unpureAliasValue: string
): DecodedSenderAddress => {
  // This works because there is no "+" character in Base64 characters
  const [aliasValue, encodedSenderAddress] = unpureAliasValue.split("+");

  return {
    aliasValue: aliasValue,
    senderAddress:
      encodedSenderAddress === undefined
        ? "" // Don't attempt to decode undefined
        : Base64.decode(encodedSenderAddress)
  };
};

const decodeEmailAddress = (
  encodedEmailAddress: string
): DecodedSenderAddress => {
  const parsed = addrs.parseOneAddress(
    encodedEmailAddress
  ) as addrs.ParsedMailbox;

  return decodeUnpureAliasValue(parsed.local);
};

export default {
  encodeUnpureAliasValue,
  encodeEmailAddress,
  decodeUnpureAliasValue,
  decodeEmailAddress
};
