require("dotenv").config();

module.exports.domain = () => {
  if (!process.env.DOMAIN) {
    throw new Error("DOMAIN environment variable is not set");
  }
  return process.env.DOMAIN;
};

module.exports.email = () => {
  if (!process.env.EMAIL) {
    throw new Error("EMAIL environment variable is not set");
  }
  return process.env.EMAIL;
};
