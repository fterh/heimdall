import { generateOperationalDomain, readNumWords } from "../../lib/env";

describe("generateOperationalDomain", () => {
  it("should return baseDomain in production when devSubdomain is set", () => {
    expect(generateOperationalDomain("prod", "test", "domain.com")).toBe(
      "domain.com"
    );
  });
  it("should return baseDomain in production when devSubdomain is not set", () => {
    expect(generateOperationalDomain("prod", "", "domain.com")).toBe(
      "domain.com"
    );
  });
  it("should return devSubdomain.baseDomain in development when devSubdomain is set", () => {
    expect(generateOperationalDomain("dev", "test", "domain.com")).toBe(
      "test.domain.com"
    );
  });
  it("should throw if devSubdomain is not set in development", () => {
    expect(() => {
      generateOperationalDomain("dev", "", "domain.com");
    }).toThrow(
      new Error(
        "DEV_SUBDOMAIN environment variable must be set when deploying to dev stage"
      )
    );
  });
});

describe("readNumWords", () => {
  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  it("should read valid NUM_WORDS environment config paramter", () => {
    process.env.NUM_WORDS = "5";
    expect(readNumWords()).toBe(5);
  });

  it("should default to 2 if no NUM_WORDS environment config paramter is provided", () => {
    expect(readNumWords()).toBe(2);
  });
  it("should default to 2 if an invalid NUM_WORDS environment config paramter is provided", () => {
    process.env.NUM_WORDS = "three";
    expect(readNumWords()).toBe(2);
  });
});
