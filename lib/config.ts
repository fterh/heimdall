import env from "./env";

const TABLE_BASE_NAME = "aliases";

const exportData = {
  tableName: `${TABLE_BASE_NAME}-${env.stage}`
};

export default exportData;

// Play nice with serverless.
module.exports.serverless = () => exportData;
