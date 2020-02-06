import { generateOperationalDomain } from "../../lib/env";

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
