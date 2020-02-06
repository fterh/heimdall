require("dotenv").config();

const readEnvironmentVariable = (key, optional = false) => {
  if (!process.env[key]) {
    if (!optional) {
      throw new Error(`${key} environment variable is not set.`);
    }
    console.warn(
      `${key} environment variable is not set. Defaulting to an empty string.`
    );
    return "";
  }
  return process.env[key];
};

const readEnvironmentVariables = arr => {
  return arr.map(key => readEnvironmentVariable(key));
};

let awsId,
  awsSmtpHost,
  awsSmtpPort,
  awsSmtpUser,
  awsSmtpPass,
  baseDomain,
  devSubdomain,
  email;
[
  awsId,
  awsSmtpHost,
  awsSmtpPort,
  awsSmtpUser,
  awsSmtpPass,
  baseDomain,
  email
] = readEnvironmentVariables([
  "AWS_ID",
  "AWS_SMTP_HOST",
  "AWS_SMTP_PORT",
  "AWS_SMTP_USER",
  "AWS_SMTP_PASS",
  "BASE_DOMAIN",
  "EMAIL"
]);
[devSubdomain] = readEnvironmentVariables(["DEV_SUBDOMAIN"], true);

const operationalDomain = (devSubdomain ? `${devSubdomain}.` : "") + baseDomain;
const stage = process.env["STAGE"] || "dev";

const exportData = {
  awsId,
  awsSmtpHost,
  awsSmtpPort,
  awsSmtpUser,
  awsSmtpPass,
  baseDomain,
  devSubdomain,
  email,
  operationalDomain,
  stage
};

module.exports = exportData;

// Play nice with serverless.
module.exports.serverless = () => exportData;
