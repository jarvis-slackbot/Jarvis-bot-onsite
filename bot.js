'use strict';
//require('./setEnvironments.js');
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

//if did not correctly promise return a slackTemplate message may not be intercepted or maybe if not returned on time, even with delay (kinda a bad feature)  
api.intercept((event) => {
    if (!event.slackEvent){ // if this is a normal web request, let it run
        return event;
    }

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
                return slackDelayedReply(data, message.channelMessage(true).addText("returned a string\n").get());
            }
            // Response that pinged AWS (res is a Promise function)
            // msg should be a SlackTemplate object
            // TODO - Error checking for promise function
            else { //: i think it executes slack delay and returns a false (nothing) to this method. added a text for better debugging. possibility too: If there is an error in a command you may not see it since it may not be correct nor return anything. So what you do is call another command that you know is correct and it will get to this portion of the code and you may find there is an error in the code--sadly no complete trace to the bad command. health caught an error in the intercept's promise delay's return meaning something wrong in return, probably res. ec2status did not return a string in the intercept's promiseDelay's return, meaning res was passed, but wasn't a string.
                return res.then((msg) => {
                    return slackDelayedReply(data, msg.channelMessage(true).get());
                    //may be causing errors if attach text
                    //.addText("did not return a string in the intercept's promiseDelay's return")
                }).then(() => false).catch((err) => {
                    return slackDelayedReply(data, err.channelMessage(true).get());
                    //.addText("caught an error in the intercept's promiseDelay's return")
                });
            }
        })
        .then(() => false) // prevent normal execution
        .catch((err) => {
            return slackDelayedReply(data, err.channelMessage(true).get());
        //.addText("error caught in the intercept's promiseDelay")
        }); 
});



module.exports = api;


//module.exports = auth.api;

