import { Base64 } from "js-base64";
import addrs from "email-addresses";
import { operationalDomain } from "../env";

export interface DecodedSenderAddress {
  alias: string;
  senderAddress: string;
}

/**
 * An abstraction to manage the encoding and decoding
 * of reply-to email addresses that encapsulate the
 * original sender's email address.
 */

const encodeUnpureAlias = (
  alias: string,
  originalSenderAddress: string
): string => {
  const encodedSenderAddress = Base64.encode(originalSenderAddress);
  return `${alias}+${encodedSenderAddress}`;
};

const encodeEmailAddress = (
  alias: string,
  originalSenderAddress: string
): string => {
  return `${encodeUnpureAlias(
    alias,
    originalSenderAddress
  )}@${operationalDomain}`;
};

const decodeUnpureAlias = (unpureAlias: string): DecodedSenderAddress => {
  // This works because there is no "+" character in Base64 characters
  const [alias, encodedSenderAddress] = unpureAlias.split("+");

  return {
    alias,
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

  return decodeUnpureAlias(parsed.local);
};

export default {
  encodeUnpureAlias,
  encodeEmailAddress,
  decodeUnpureAlias,
  decodeEmailAddress
};
