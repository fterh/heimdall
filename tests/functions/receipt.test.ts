import { ParsedMail } from "mailparser";
import { handleAliases } from "../../functions/receipt";
import handleCommand from "../../lib/commands";
import forwardIOB from "../../lib/forwardInboundOrOutbound";
import generateTestEmail from "../utils/generateTestEmail";

jest.mock("../../lib/commands");
jest.mock("../../lib/forwardInboundOrOutbound");

let testEmail: ParsedMail;
beforeAll(async () => {
  testEmail = await generateTestEmail({
    to: [{ email: "doesnotmatter@domain.com" }]
  });
});

it("should handle commands by passing them to the commands module", async () => {
  await handleAliases(["generate"], testEmail);
  await handleAliases(["list"], testEmail);
  await handleAliases(["remove"], testEmail);

  expect(handleCommand).toHaveBeenCalledTimes(3);
});

it("should handle non-commands by delegating to the forwardInboundOrOutbound module", async () => {
  await handleAliases(["someAlias"], testEmail);

  expect(forwardIOB).toHaveBeenCalledTimes(1);
});
