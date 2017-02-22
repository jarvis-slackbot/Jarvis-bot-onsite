/*
    AWS EC2
    API: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
 */

//Library
var botBuilder = require('claudia-bot-builder');
//const SlackTemplate = botBuilder.slackTemplate;
//const msg = require('./message.js');

// AWS S3
const aws = require('aws-sdk');
const s3Data = new AWS.S3({
    region: 'us-west-2',
    maxRetries: 15,
    apiVersion: '2016-11-15'
});

module.exports = {
    
    
};







