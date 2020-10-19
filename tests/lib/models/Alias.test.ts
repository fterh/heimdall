import { DynamoDB } from "aws-sdk";
import * as AWSMock from "aws-sdk-mock";
import Alias, { AliasData } from "../../../lib/models/Alias";
import generateAliasValue from "../../../lib/models/generateAliasValue";

jest.mock("../../../lib/models/generateAliasValue");

type Callback = (err: any, data: any) => void;

describe("Test aliasExists", () => {
  beforeEach(() => {
    AWSMock.mock(
      "DynamoDB.DocumentClient",
      "get",
      (params: any, callback: Callback) => {
        if (params.Key.alias === "existingalias") {
          callback(null, { Item: {} });
        } else {
          callback(null, {});
        }
      }
    );

    const client = new DynamoDB.DocumentClient();
    Alias.useClient(client);
  });

  afterEach(() => {
    AWSMock.restore();
  });

  it("should return true if alias exists in database", async () => {
    const res = await Alias.aliasExists("existingalias");
    expect(res).toBe(true);
  });

  it("should return false if alias does not exist in database", async () => {
    const res = await Alias.aliasExists("nonexistentalias");
    expect(res).toBe(false);
  });
});

describe("Test generateAlias", () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should generate alias values until there is no collision, then put to table", async () => {
    jest
      .spyOn(Alias, "aliasExists")
      .mockImplementationOnce(async () => true)
      .mockImplementationOnce(async () => true)
      .mockImplementationOnce(async () => false);

    const putSpy = jest
      .spyOn(Alias, "putAlias")
      .mockImplementation(async () => {});

    await Alias.generateAlias("some description");

    expect(generateAliasValue).toHaveBeenCalledTimes(3);
    expect(putSpy).toHaveBeenCalledTimes(1);
    expect(putSpy.mock.calls[0][0].value).toBe("randomlygeneratedaliasvalue");
    expect(putSpy.mock.calls[0][0].description).toBe("some description");
    expect(putSpy.mock.calls[0][0].countReceived).toBe(0);
    expect(putSpy.mock.calls[0][0].countSent).toBe(0);
  });
});

describe("Test getAllAliases", () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    AWSMock.restore();
  });

  it("should map raw results into alias objects", async () => {
    const creationDate1 = new Date();
    const rawResult1 = {
      alias: "value1",
      description: "description1",
      creationDate: creationDate1.getTime(),
      countReceived: 1,
      countSent: 2
    };

    const creationDate2 = new Date();
    const lastReceivedDate2 = new Date();
    const rawResult2 = {
      alias: "value2",
      description: "description2",
      creationDate: creationDate2.getTime(),
      countReceived: 3,
      countSent: 4,
      lastReceivedDate: lastReceivedDate2.getTime()
    };

    AWSMock.mock(
      "DynamoDB.DocumentClient",
      "scan",
      (params: any, callback: Callback) => {
        callback(null, { Items: [rawResult1, rawResult2] });
      }
    );

    const client = new DynamoDB.DocumentClient();
    Alias.useClient(client);

    const res = await Alias.getAllAliases();
    expect(res.aliases[0]).toBeInstanceOf(Alias);
    expect(res.aliases[0]).toBeInstanceOf(Alias);
    expect(res).toMatchObject({
      aliases: [
        {
          value: "value1",
          description: "description1",
          creationDate: creationDate1,
          countReceived: 1,
          countSent: 2,
          lastReceivedDate: undefined,
          lastSentDate: undefined
        },
        {
          value: "value2",
          description: "description2",
          creationDate: creationDate2,
          countReceived: 3,
          countSent: 4,
          lastReceivedDate: lastReceivedDate2,
          lastSentDate: undefined
        }
      ]
    });
  });

  it("should return an empty results object if there are no aliases", async () => {
    AWSMock.mock(
      "DynamoDB.DocumentClient",
      "scan",
      (params: any, callback: Callback) => {
        callback(null, { Items: [] });
      }
    );

    const client = new DynamoDB.DocumentClient();
    Alias.useClient(client);

    const res = await Alias.getAllAliases();

    expect(res).toStrictEqual({
      aliases: []
    });
  });

  it("should set last evaluated key if it is present", async () => {
    const testAlias = {
      alias: "value",
      description: "description",
      creationDate: new Date().getTime(),
      countReceived: 1,
      countSent: 2,
      lastReceivedDate: new Date().getTime()
    };

    AWSMock.mock(
      "DynamoDB.DocumentClient",
      "scan",
      (params: any, callback: Callback) => {
        callback(null, {
          Items: [testAlias],
          LastEvaluatedKey: {
            alias: {
              S: "foo"
            }
          }
        });
      }
    );

    const client = new DynamoDB.DocumentClient();
    Alias.useClient(client);

    const res = await Alias.getAllAliases();

    expect(res.lastEvaluatedKey).toStrictEqual({ alias: { S: "foo" } });
  });
});

describe("Test putAlias", () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    AWSMock.restore();
  });

  it("should correctly store the alias in the table", async () => {
    const spy = jest.fn();
    AWSMock.mock(
      "DynamoDB.DocumentClient",
      "put",
      (params: any, callback: Callback) => {
        spy(params);
        callback(null, null);
      }
    );

    const client = new DynamoDB.DocumentClient();
    Alias.useClient(client);

    const now = new Date();
    const testAlias: AliasData = {
      value: "aliasvalue",
      description: "aliasdescription",
      creationDate: now,
      countReceived: 10,
      countSent: 20
    };

    await Alias.putAlias(testAlias);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].Item).toStrictEqual({
      alias: "aliasvalue",
      description: "aliasdescription",
      creationDate: now.getTime(),
      countReceived: 10,
      countSent: 20,
      lastReceivedDate: undefined,
      lastSentDate: undefined
    });
  });
});

describe("Test didReceiveEmail and didSendEmail", () => {
  beforeEach(() => {
    AWSMock.mock(
      "DynamoDB.DocumentClient",
      "get",
      (params: any, callback: Callback) => {
        callback(null, {
          Item: {
            value: "value",
            description: "description",
            creationDate: new Date().getTime(),
            countReceived: 0,
            countSent: 0
          }
        });
      }
    );

    const client = new DynamoDB.DocumentClient();
    Alias.useClient(client);
  });

  afterEach(() => {
    AWSMock.restore();
  });

  it("should update alias's receipt properties and put into table", async () => {
    const putSpy = jest
      .spyOn(Alias, "putAlias")
      .mockImplementation(async () => {});

    const testAlias = (await Alias.getAlias("value")) as Alias;

    expect(testAlias.countReceived).toBe(0);
    expect(testAlias.lastReceivedDate).toBeUndefined();
    expect(putSpy).toHaveBeenCalledTimes(0);

    testAlias.didReceiveEmail();

    expect(testAlias.countReceived).toBe(1);
    expect(testAlias.lastReceivedDate).not.toBeUndefined();
    expect(putSpy).toHaveBeenCalledTimes(1);
  });

  it("should update alias's sent properties and put into table", async () => {
    const putSpy = jest
      .spyOn(Alias, "putAlias")
      .mockImplementation(async () => {});

    const testAlias = (await Alias.getAlias("value")) as Alias;

    expect(testAlias.countSent).toBe(0);
    expect(testAlias.lastSentDate).toBeUndefined();
    expect(putSpy).toHaveBeenCalledTimes(0);

    testAlias.didSendEmail();

    expect(testAlias.countSent).toBe(1);
    expect(testAlias.lastSentDate).not.toBeUndefined();
    expect(putSpy).toHaveBeenCalledTimes(1);
  });
});
