import { ParsedMail } from "mailparser";
import { email } from "../../../lib/env";
import handleCommand from "../../../lib/commands";
import generate from "../../../lib/commands/generate";
import list from "../../../lib/commands/list";
import remove from "../../../lib/commands/remove";
import generateTestEmail from "../../utils/generateTestEmail";

jest.mock("../../../lib/commands/generate");
jest.mock("../../../lib/commands/list");
jest.mock("../../../lib/commands/remove");

let testEmailAuthenticated: ParsedMail, testEmailUnauthenticated: ParsedMail;
beforeAll(async () => {
  testEmailAuthenticated = await generateTestEmail({
    from: email,
    to: "command@domain.com"
  });
  testEmailUnauthenticated = await generateTestEmail({
    from: "hostile@attacker.com",
    to: "command@domain.com"
  });
});

it("should call the right command handler", async () => {
  await handleCommand("generate", testEmailAuthenticated);
  expect(generate).toHaveBeenCalledTimes(1);

  await handleCommand("list", testEmailAuthenticated);
  expect(list).toHaveBeenCalledTimes(1);

  await handleCommand("remove", testEmailAuthenticated);
  expect(remove).toHaveBeenCalledTimes(1);
});

it("should throw if the command is unrecognized", async () => {
  const res = handleCommand("edit", testEmailAuthenticated);
  expect(res).rejects.toEqual(new Error(`"edit" is not a command`));
});

it("should throw if the command is not authenticated", async () => {
  const res = handleCommand("somecommand", testEmailUnauthenticated);
  await expect(res).rejects.toEqual(
    new Error(
      "Command email's sender is inconsistent with environment variable EMAIL."
    )
  );
});
