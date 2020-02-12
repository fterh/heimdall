import generate from "../../../lib/commands/generate";
import Alias from "../../../lib/models/Alias";
import sendEmail from "../../../lib/sendEmail";
import { email, operationalDomain } from "../../../lib/env";
import { Commands } from "../../../lib/commandSet";
import generateTestEmail from "../../utils/generateTestEmail";

jest.mock("../../../lib/sendEmail");
jest.mock("../../../lib/models/Alias");

it("should generate an alias with the description and send a response email", async () => {
  const testEmail = await generateTestEmail({
    to: [{ email: "test@domain.com" }],
    subject: "Some description"
  });

  await generate(testEmail);

  expect(Alias.generateAlias).toHaveBeenCalledTimes(1);
  expect(Alias.generateAlias).toHaveBeenCalledWith("Some description");

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(sendEmail).toHaveBeenCalledWith({
    from: `${Commands.Generate}@${operationalDomain}`,
    to: [email],
    subject: "Generated alias: randomlygeneratedaliasvalue",
    text: `You have generated randomlygeneratedaliasvalue@${operationalDomain} for "Some description".`
  });
});

it("`should generate an alias for an email without a subject", async () => {
  const testEmail = await generateTestEmail({
    to: { email: "test@domain.com" }
  });

  await generate(testEmail);

  expect(Alias.generateAlias).toHaveBeenCalledWith("No description");
});
