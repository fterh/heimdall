import list from "../../../lib/commands/list";
import sendEmail from "../../../lib/sendEmail";
import { email, operationalDomain } from "../../../lib/env";
import { Commands } from "../../../lib/commandSet";
import Alias from "../../../lib/models/Alias";

jest.mock("../../../lib/models/Alias");
jest.mock("../../../lib/sendEmail");
const _sendEmail = sendEmail as jest.Mock;

it("should send a response email with a list of alias-description records", async () => {
  await list();

  expect(Alias.getAllAliases).toHaveBeenCalledTimes(1);

  expect(sendEmail).toHaveBeenCalledTimes(1);
  expect(_sendEmail.mock.calls[0][0].from).toBe(
    `${Commands.List}@${operationalDomain}`
  );
  expect(_sendEmail.mock.calls[0][0].to).toStrictEqual([email]);
  expect(_sendEmail.mock.calls[0][0].subject).toContain("Alias list");
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

  await list();

  expect(_sendEmail.mock.calls[0][0].text).toBe("No aliases found.");
});
