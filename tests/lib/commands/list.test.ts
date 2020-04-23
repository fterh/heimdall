import list from "../../../lib/commands/list";
import sendEmail from "../../../lib/sendEmail";
import { email, operationalDomain } from "../../../lib/env";
import { Commands } from "../../../lib/commandSet";
import Alias from "../../../lib/models/Alias";
import generateTestEmail from "../../utils/generateTestEmail";

jest.mock("../../../lib/models/Alias");
jest.mock("../../../lib/sendEmail");
const _sendEmail = sendEmail as jest.Mock;

const testEmailPromise = generateTestEmail(
  {
    to: [{ email: "test@domain.com" }],
    subject: "validexistingalias"
  },
  "messageId"
);

it("should send a response email with a list of alias-description records", async () => {
  await list(await testEmailPromise);

  expect(Alias.getAllAliases).toHaveBeenCalledTimes(1);

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(_sendEmail.mock.calls[0][0].from).toStrictEqual({
    name: "List",
    address: `${Commands.List}@${operationalDomain}`
  });
  expect(_sendEmail.mock.calls[0][0].to).toStrictEqual([email]);
  expect(_sendEmail.mock.calls[0][0].inReplyTo).toBe("messageId");
  expect(_sendEmail.mock.calls[0][0].references).toStrictEqual(["messageId"]);
  expect(_sendEmail.mock.calls[0][0].subject).toBe("validexistingalias");
  expect(_sendEmail.mock.calls[0][0].text).toContain(
    "Alias : Description\nalias1 : description1\nalias2 : description2\nalias3 : description3\n"
  );
  expect(_sendEmail.mock.calls[0][0].text).toContain(
    "There might be more records in the results set. Check the logs and database for more information."
  );
});

it("should send a response email indicating no records found", async () => {
  jest.spyOn(Alias, "getAllAliases").mockImplementation(async () => {
    return {
      aliases: []
    };
  });

  await list(await testEmailPromise);

  expect(_sendEmail.mock.calls[0][0].text).toBe("No aliases found.");
});
