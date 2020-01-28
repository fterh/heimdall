import { ParsedMail } from "mailparser";
import processAliases from "../../lib/processAliases";
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
  await processAliases(["generate"], testEmail);
  await processAliases(["list"], testEmail);
  await processAliases(["remove"], testEmail);

  expect(handleCommand).toHaveBeenCalledTimes(3);
});

it("should handle non-commands by delegating to the forwardInboundOrOutbound module", async () => {
  await processAliases(["someAlias"], testEmail);

  expect(forwardIOB).toHaveBeenCalledTimes(1);
});
