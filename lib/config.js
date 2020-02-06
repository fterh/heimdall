const env = require("./env");

const TABLE_BASE_NAME = "aliases";

const exportData = {
  tableName: `${TABLE_BASE_NAME}-${env.stage}`
};

module.exports = exportData;

// Play nice with serverless.
module.exports.serverless = () => exportData;
