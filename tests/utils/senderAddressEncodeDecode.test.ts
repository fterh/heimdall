import senderAddressEncodeDecode from "../../lib/utils/senderAddressEncodeDecode";

const alias = "testAlias";
const senderAddress = "originalsender@domain.com";

test("encode alias and email address", () => {
  const encoded = senderAddressEncodeDecode.encodeEmailAddress(
    alias,
    senderAddress
  );
  const decoded = senderAddressEncodeDecode.decodeEmailAddress(encoded);

  expect(decoded.alias).toBe(alias);
  expect(decoded.senderAddress).toBe(senderAddress);
});

test("encode alias and empty email address", () => {
  const encoded = senderAddressEncodeDecode.encodeEmailAddress(alias, "");
  const decoded = senderAddressEncodeDecode.decodeEmailAddress(encoded);

  expect(decoded.alias).toBe(alias);
  expect(decoded.senderAddress).toBe("");
});
