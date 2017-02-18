/*
    AWS Health checks
    Service wide health checks - Must narrow to users region
 */
const ec2 = require('./ec2.js');
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const msg = require('./message.js');

var health = new AWS.Health({apiVersion: '2016-08-04'});

module.exports = {

    // Get list of unavailable services
    getAWSHealth: function(){
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();
            health.describeEvents({}, function(err, data){
                var text = data.toString();
                slackMsg.addAttachment(msg.getAttachNum());
                slackMsg.addText(text);
                resolve(slackMsg);
            });
        });

    },
};