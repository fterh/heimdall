import extractEmailAliases from "../../lib/extractEmailAliases";
import generateTestEmail from "../utils/generateTestEmail";

test("Verified domain email appears singly in `to` header", async () => {
  const email = await generateTestEmail({
    to: [{ email: "test@domain.com" }, { email: "test@domain1.com" }]
  });
  const extracted = extractEmailAliases(email);
  expect(extracted).toStrictEqual(["test"]);
});

test("Verified domain email appears singly in `cc` header", async () => {
  const email = await generateTestEmail({
    to: [{ email: "test@domain1.com" }, { email: "test@domain2.com" }],
    cc: [{ email: "test@domain3.com" }, { email: "test@domain.com" }]
  });
  const extracted = extractEmailAliases(email);
  expect(extracted).toStrictEqual(["test"]);
});

test("Verified domain email appears numerous times in `to` and `cc` headers", async () => {
  const email = await generateTestEmail({
    to: [{ email: "test1@domain.com" }, { email: "test2@domain2.com" }],
    cc: [{ email: "test3@domain3.com" }, { email: "test4@domain.com" }]
  });
  const extracted = extractEmailAliases(email);
  expect(extracted).toStrictEqual(["test1", "test4"]);
});

it(`should handle "alias+base64@domain.com" format`, async () => {
  const email = await generateTestEmail({
    to:
      "testAlias+dGhlcXVpY2ticm93bmZveGp1bXBlZG92ZXJ0aGVsYXp5ZG9nQHdlaXJkZG9tYWluLmNvbQ==@domain.com"
  });
  const extracted = extractEmailAliases(email);
  expect(extracted).toStrictEqual([
    "testAlias+dGhlcXVpY2ticm93bmZveGp1bXBlZG92ZXJ0aGVsYXp5ZG9nQHdlaXJkZG9tYWluLmNvbQ=="
  ]);
});
