require("dotenv").config();

const readEnvironmentVariable = key => {
  if (!process.env[key]) {
    throw new Error(`${key} environment variable is not set`);
  }
  return process.env[key];
};

const readEnvironmentVariables = arr => {
  return arr.map(key => readEnvironmentVariable(key));
};

let awsId, awsSmtpHost, awsSmtpPort, awsSmtpUser, awsSmtpPass, domain, email;
[
  awsId,
  awsSmtpHost,
  awsSmtpPort,
  awsSmtpUser,
  awsSmtpPass,
  domain,
  email
] = readEnvironmentVariables([
  "AWS_ID",
  "AWS_SMTP_HOST",
  "AWS_SMTP_PORT",
  "AWS_SMTP_USER",
  "AWS_SMTP_PASS",
  "DOMAIN",
  "EMAIL"
]);

const exportData = {
  awsId,
  awsSmtpHost,
  awsSmtpPort,
  awsSmtpUser,
  awsSmtpPass,
  domain,
  email
};

module.exports = exportData;

// Play nice with serverless.
module.exports.serverless = () => exportData;
