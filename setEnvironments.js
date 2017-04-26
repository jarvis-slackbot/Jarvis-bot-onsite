//Developed to set environment variables at runtime for security reasons
//Sets environment variables from env.js which module.exports a JSON

var json = require('./.env.js').json;


//SETTING ENVIRONMENT VARIABLES
//SLACK
process.env.SLACK_CLIENT_ID = json.SLACK.SLACK_CLIENT_ID;
process.env.SLACK_CLIENT_SECRET = json.SLACK.SLACK_CLIENT_SECRET;
process.env.SLACK_VERIFICATION_TOKEN = json.SLACK.SLACK_VERIFICATION_TOKEN;
process.env.SLACK_TEST_TOKEN = json.SLACK.SLACK_TEST_TOKEN;
//AWS
process.env.AWS_PROFILE = json.AWS.AWS_PROFILE;
process.env.AWS_ACCESS_KEY_ID = json.AWS.AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = json.AWS.AWS_SECRET_ACCESS_KEY;
process.env.AWS_REGION = json.AWS.AWS_REGION;