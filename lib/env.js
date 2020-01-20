require("dotenv").config();

const missingEnvironmentVariable = key => {
  throw new Error(`${key} environment variable is not set`);
};

module.exports.awsId = () => {
  if (!process.env.AWS_ID) {
    missingEnvironmentVariable("AWS_ID");
  }
  return process.env.AWS_ID;
};

module.exports.domain = () => {
  if (!process.env.DOMAIN) {
    missingEnvironmentVariable("DOMAIN");
  }
  return process.env.DOMAIN;
};

module.exports.email = () => {
  if (!process.env.EMAIL) {
    missingEnvironmentVariable("EMAIL");
  }
  return process.env.EMAIL;
};
