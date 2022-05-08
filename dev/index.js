const fs = require("fs");
const mailparser = require("mailparser");

const simpleParser = mailparser.simpleParser;
const data = fs.readFileSync("./data");
simpleParser(data).then(email => {
    console.log(email);
});