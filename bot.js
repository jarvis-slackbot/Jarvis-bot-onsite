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
    
    if(1/*apiRequest.queryString != ""*/){
        return "Hello! Here is fn. botBuilder: " + botBuilder.toString() + "\nmessage: " + JSON.stringify(message) + "\napiRequest: " + JSON.stringify(apiRequest) + "request";
    }
    /*Need to get into anonymous function / method call
    [api.get('/', () => 'OK')] 
    in bot-builder.js OR /lib/slack/setup.js.
    
    fn botBuilder's, apiBuilder's method call (bot-builder.js)
    OR
    fn botBuilder's, fn slackSetup's var api method call () (/lib/slack/setup.js)
    (slackSetup(api, messageHandlerPromise, logError);) 
    
    >>Regardless they are same apiBuilder.<<
    
    -OR-
    
    noticed apiBuilder returned api <<(apiBuilder)
    DANGER:: if you return your own apiBuilder, slack/slash command won't exist and much of other code is meaningless
    
    ---BEST---
    Find a way to pass through apiRequest to .get('/slack/landing' through lambda
    
    IN AWS CONSOLE, 
        most of this is already configured for you by claudia, all you should need to do is paste slackRedirectUrl for slack button. I think...
    
    here: https://github.com/claudiajs/claudia-bot-builder/blob/master/lib/slack/setup.js
        FIND: api.get('/slack/landing
        
    ---LAST OPTION---
    const rp = require('minimal-request-promise');
    const qs = require('querystring');
    api.get('/slack/auth', request => {
      return rp.post('https://slack.com/api/oauth.access', {
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: qs.encode({
                  client_id: request.env.slackClientId,
                  client_secret: request.env.slackClientSecret,
                  code: request.queryString.code,
                  redirect_uri: request.env.slackRedirectUrl
              })
          })
          .then(() => request.env.slackHomePageUrl); //could change to redirect to slack team or relay a results message (like a git blob, page, etc.)
    }, {
      success: 302
    });
        
        
    
    bot(parser(request.post), request)
    TESTING VIA:
    post to /slack/slash-command with 
    should have worked, but POST, reads -command as flag
    curl -sk -H "Content-Type: application/json" "https://hk26t3ags3.execute-api.us-west-2.amazonaws.com/latest/slack/slash-command" -X POST -d '{"env":{"slackVerificationToken":"key"}}'
    */
    
    
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


//module.exports = auth.api;

