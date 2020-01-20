import { handleAliases } from "../../functions/receipt";
import * as handleCommand from "../../lib/commands";
import * as forwardInbound from "../../lib/forwardInbound";
import generateTestEmail from "../utils/generateTestEmail";

jest.mock("../../lib/commands");
jest.mock("../../lib/forwardInbound");

it("should handle commands by passing them to the commands module", async () => {
  const testEmail = await generateTestEmail({
    to: [{ email: "doesnotmatter@domain.com" }]
  });

  await handleAliases(["generate"], testEmail);
  await handleAliases(["list"], testEmail);
  await handleAliases(["remove"], testEmail);
  await handleAliases(["alias"], testEmail);

  expect(handleCommand.default).toHaveBeenCalledTimes(3);
  expect(forwardInbound.default).toHaveBeenCalledTimes(1);
});
