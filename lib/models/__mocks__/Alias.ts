import { AliasData } from "../Alias";

export const now = new Date();
export const didReceiveEmailSpy = jest.fn();
export const didSendEmailSpy = jest.fn();
export const INVALID_ALIAS = "invalidalias";

export default class MockAlias implements AliasData {
  value: string;
  description: string;
  creationDate: Date;
  countReceived: number;
  countSent: number;
  lastReceivedDate?: Date;
  lastSentDate?: Date;

  constructor(options: AliasData) {
    this.value = options.value;
    this.description = options.description;
    this.creationDate = options.creationDate;
    this.countReceived = options.countReceived;
    this.countSent = options.countSent;
    this.lastReceivedDate = options.lastReceivedDate;
    this.lastSentDate = options.lastSentDate;
  }

  static generateAlias = jest.fn(async (description: string) => {
    return new MockAlias({
      value: "randomlygeneratedaliasvalue",
      description,
      creationDate: now,
      countReceived: 0,
      countSent: 0
    });
  });

  static getAlias = jest.fn(async (aliasValue: string) => {
    if (aliasValue === INVALID_ALIAS) {
      return;
    }

    return new MockAlias({
      value: aliasValue,
      description: "test description",
      creationDate: now,
      countReceived: 0,
      countSent: 0
    });
  });

  static getAllAliases = jest.fn(async () => {
    return {
      aliases: [
        new MockAlias({
          value: "alias1",
          description: "description1",
          creationDate: new Date(),
          countReceived: 1,
          countSent: 1
        }),
        new MockAlias({
          value: "alias2",
          description: "description2",
          creationDate: new Date(),
          countReceived: 2,
          countSent: 2
        }),
        new MockAlias({
          value: "alias3",
          description: "description3",
          creationDate: new Date(),
          countReceived: 3,
          countSent: 3
        })
      ],
      lastEvaluatedKey: {
        alias: {
          S: "alias3"
        }
      }
    };
  });

  async didReceiveEmail() {
    didReceiveEmailSpy();
  }

  async didSendEmail() {
    didSendEmailSpy();
  }
}
