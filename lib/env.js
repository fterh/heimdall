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

let awsId, domain, email;
[awsId, domain, email] = readEnvironmentVariables([
  "AWS_ID",
  "DOMAIN",
  "EMAIL"
]);

const exportData = {
  awsId,
  domain,
  email
};

module.exports = exportData;

// Play nice with serverless.
module.exports.serverless = () => exportData;
