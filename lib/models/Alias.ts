import { DynamoDB } from "aws-sdk";
import config from "../config";
import generateAliasValue from "./generateAliasValue";

export interface AliasData {
  value: string;
  description: string;
  creationDate: Date;
  countReceived: number;
  countSent: number;
  lastReceivedDate?: Date;
  lastSentDate?: Date;
}

export interface GetAliasesResult {
  aliases: Array<Alias>;
  lastEvaluatedKey?: DynamoDB.Key;
}

export interface AliasConfig {
  aliasValue?: string;
  description: string;
}

export default class Alias implements AliasData {
  private _value: string;
  private _description: string;
  private _creationDate: Date;
  private _countReceived: number;
  private _countSent: number;
  private _lastReceivedDate?: Date;
  private _lastSentDate?: Date;

  private static client = new DynamoDB.DocumentClient();

  // Public getters (readonly properties)

  get value(): string {
    return this._value;
  }
  get description(): string {
    return this._description;
  }
  get creationDate(): Date {
    return this._creationDate;
  }
  get countReceived(): number {
    return this._countReceived;
  }
  get countSent(): number {
    return this._countSent;
  }
  get lastReceivedDate(): Date | undefined {
    return this._lastReceivedDate;
  }
  get lastSentDate(): Date | undefined {
    return this._lastSentDate;
  }

  protected constructor(options: AliasData) {
    this._value = options.value;
    this._description = options.description;
    this._creationDate = options.creationDate;
    this._countReceived = options.countReceived;
    this._countSent = options.countSent;
    this._lastReceivedDate = options.lastReceivedDate;
    this._lastSentDate = options.lastSentDate;
  }

  // Utils

  private static generateGetParams(
    aliasValue: string
  ): DynamoDB.DocumentClient.GetItemInput {
    return {
      TableName: config.tableName,
      Key: {
        alias: aliasValue
      }
    };
  }

  private static generatePutParams(
    alias: AliasData
  ): DynamoDB.DocumentClient.PutItemInput {
    return {
      TableName: config.tableName,
      Item: {
        alias: alias.value,
        description: alias.description,
        creationDate: alias.creationDate.getTime(),
        countReceived: alias.countReceived,
        countSent: alias.countSent,
        lastReceivedDate: alias.lastReceivedDate?.getTime(),
        lastSentDate: alias.lastSentDate?.getTime()
      }
    };
  }

  private static convertRawDataToAlias(
    rawAlias: DynamoDB.DocumentClient.AttributeMap
  ): Alias {
    return new Alias({
      value: rawAlias.alias,
      description: rawAlias.description,
      creationDate: new Date(rawAlias.creationDate),
      countReceived: rawAlias.countReceived,
      countSent: rawAlias.countSent,
      lastReceivedDate: rawAlias.lastReceivedDate
        ? new Date(rawAlias.lastReceivedDate)
        : undefined,
      lastSentDate: rawAlias.lastSentDate
        ? new Date(rawAlias.lastSentDate)
        : undefined
    });
  }

  // Dependency injection for testing
  static useClient(client: DynamoDB.DocumentClient) {
    this.client = client;
  }

  // Static methods

  static async aliasExists(aliasValue: string): Promise<boolean> {
    console.log(`Checking if alias of value=${aliasValue} exists`);

    const possibleAlias = await Alias.getAlias(aliasValue);
    return possibleAlias !== undefined;
  }

  static async generateAlias({ aliasValue, description }: AliasConfig) {
    console.log(`Generating new alias ${aliasValue} for description=${description}`);

    let value = aliasValue?.trim()
    if (!aliasValue) {
      do {
        value = generateAliasValue();
      } while (await Alias.aliasExists(value));
    }

    if (!/^[A-Z0-9._%+-]*$/i.test(value!)) {
      throw new Error(
        `Alias value ${aliasValue} is invalid. It must only contain alphanumeric characters, periods, underscores, and hyphens.`
      );
    }


    console.log(
      `Generated aliasValue=${value} for description=${description}`
    );

    const alias = new Alias({
      value: value!,
      description,
      creationDate: new Date(),
      countReceived: 0,
      countSent: 0
    });

    await Alias.putAlias(alias);

    return alias;
  }

  static async getAlias(aliasValue: string): Promise<Alias | void> {
    console.log(`Attempting to get alias of value=${aliasValue} from table`);

    const params = Alias.generateGetParams(aliasValue);
    const res = await Alias.client.get(params).promise();
    const rawAlias = res.Item;

    if (rawAlias === undefined) {
      console.log(`Alias of value=${aliasValue} does not exist`);
      return;
    }

    const alias = Alias.convertRawDataToAlias(rawAlias);

    return alias;
  }

  static async getAllAliases(): Promise<GetAliasesResult> {
    console.log("Scanning table for alias records");

    const records: DynamoDB.DocumentClient.ScanOutput = await Alias.client
      .scan({
        TableName: config.tableName
      })
      .promise();

    console.log("Scan operation completed");

    if (records.Items === undefined || records.Items.length === 0) {
      return {
        aliases: []
      };
    }

    return {
      aliases: records.Items.map(Alias.convertRawDataToAlias),
      lastEvaluatedKey: records.LastEvaluatedKey
    };
  }

  static async putAlias(alias: AliasData): Promise<void> {
    console.log(`Attempting to put alias=${alias} into table`);

    const params = Alias.generatePutParams(alias);
    await Alias.client.put(params).promise();

    console.log("Successfully put alias into table");
  }

  // Instance methods

  async didReceiveEmail(): Promise<void> {
    this._countReceived += 1;
    this._lastReceivedDate = new Date();

    await Alias.putAlias(this);
  }

  async didSendEmail(): Promise<void> {
    this._countSent += 1;
    this._lastSentDate = new Date();

    await Alias.putAlias(this);
  }
}
