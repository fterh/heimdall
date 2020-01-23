import { email } from "../../lib/env";
import forwardIOB from "../../lib/forwardInboundOrOutbound";
import forwardInbound from "../../lib/forwardInbound";
import forwardOutbound from "../../lib/forwardOutbound";
import generateTestEmail from "../utils/generateTestEmail";

jest.mock("../../lib/forwardInbound");
jest.mock("../../lib/forwardOutbound");

it("should inbound-forward emails not sent by user", async () => {
  const testEmail = await generateTestEmail({
    from: "sender@domain.com",
    to: "shouldnotmatter@domain.com"
  });
  await forwardIOB("testalias", testEmail);

  expect(forwardInbound).toHaveBeenCalledTimes(1);
});

it("should outbound-forward emails sent by user", async () => {
  const testEmail = await generateTestEmail({
    from: email,
    to: "shouldnotmatter@domain.com"
  });
  await forwardIOB("testalias", testEmail);

  expect(forwardOutbound).toHaveBeenCalledTimes(1);
});
