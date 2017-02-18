/*
    AWS Health checks
    Service wide health checks - Must narrow to users region
    API MAY NOT BE AVAILABLE YET OR NOT AVAILABLE IN US-WEST-2
    API: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Health.html
 */
const ec2 = require('./ec2.js');
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const msg = require('./message.js');
const aws = require('aws-sdk');

var health = new aws.Health({apiVersion: '2016-08-04'});

module.exports = {

    // Get list of unavailable services
    getAWSHealth: function(){
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();
            var params = {
                filter: {
                    eventArns: ['arn:aws:health:us-east-1::event/AWS_EC2_MAINTENANCE_5331']
                }
            };
            health.describeAffectedEntities(params, function(err, data){
                if(err){reject(msg.errorMessage(err.toString()));}
                //var text = JSON.stringify(data)
                var text = "I am not able to access this information yet. Please visit " +
                    "https://status.aws.amazon.com/ " + "to see AWS health information.";
                slackMsg.addAttachment(msg.getAttachNum());
                slackMsg.addText(text);
                resolve(slackMsg);
            });
        });

    }
};