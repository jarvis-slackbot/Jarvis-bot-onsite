'use strict';
const aws = require('aws-sdk');
const promiseDelay = require('promise-delay');
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const slackDelayedReply = botBuilder.slackDelayedReply;
const lambda = new aws.Lambda();
const msg = require('./message.js');


const api = botBuilder((message, apiRequest) => {

    return new Promise((resolve, reject) => {
        lambda.invoke({
            FunctionName: apiRequest.lambdaContext.functionName,
            InvocationType: 'Event',
            Payload: JSON.stringify({
                slackEvent: message // this will enable us to detect the event later and filter it
            }),
            Qualifier: apiRequest.lambdaContext.functionVersion
        }, (err, done) => {
            if (err) return reject(err);

            resolve();
        });
    })
        .then(() => {
            return new SlackTemplate("Thinking...").channelMessage(true).get();
        })
        .catch((err) => {
            var error = "Error: " + err.toString();
            return new SlackTemplate(error).channelMessage(true).get();
        });

}, { platforms: ['slackSlashCommand'] });

api.intercept((event) => {
    if (!event.slackEvent) // if this is a normal web request, let it run
        return event;

    var data = event.slackEvent;
    var userMsg = data.text;    // Users command (Everything after /jarvis)
    //name = event.slackEvent.user_name;      // Users slack name
    var res = msg.pickResponse(userMsg);
    //message.addAttachment("A").addText(res);  // Attachment to message
    // Does not work without this delay
    return promiseDelay(1000)
        .then(() => {
            // AI or test response
            if(typeof res === 'string' || res instanceof String){
                var message = new SlackTemplate(res);
                return slackDelayedReply(data, message.channelMessage(true).get());
            }
            // Response that pinged AWS (res is a Promise function)
            // msg should be a SlackTemplate object
            // TODO - Error checking for promise function
            else {
                return res.then((msg) => {
                    return slackDelayedReply(data, msg.channelMessage(true).get());
                }).then(() => false).catch((err) => {
                    return slackDelayedReply(data, err.channelMessage(true).get());
                });
            }
        })
        .then(() => false); // prevent normal execution
});



module.exports = api;
