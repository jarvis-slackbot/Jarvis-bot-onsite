'use strict';
const qs = require('querystring');
const aws = require('aws-sdk');
var http = require('http');
var http_request = require('sync-request'); // DEMO ONLY
const promiseDelay = require('promise-delay');
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const slackDelayedReply = botBuilder.slackDelayedReply;


const lambda = new aws.Lambda();

// Slack colors
const SLACK_GREEN = 'good';
const SLACK_YELLOW = 'warning';
const SLACK_RED = 'danger';

// EC2 server states
const EC2_ONLINE = 'running';
const EC2_OFFLINE = 'stopped';
const EC2_TERM = 'terminated';

// AMI states
const AMI_AVBL = 'available';
const AMI_PEND = 'pending';

const SLACK_AUTH = "https://slack.com/api_gateway/oauth.access";
const CLIENT_ID = "81979454913.97303513202";
const CLIENT_SECRET = "ab85e84c73978ce51d8e28103de895d9";
const SCOPES = "bot";  // Space separated
const TOKEN = "5aPJyd1E0IrszzWpRCBl0LnS";

// AWS cloud watch
const cw = new aws.CloudWatch({region: 'us-west-2', maxRetries: 15,apiVersion: '2010-08-01'});
// AWS EC2
const ec2 = new aws.EC2({region: 'us-west-2', maxRetries: 15, apiVersion: '2016-11-15'});

// Attachment number
var attachNum = 0;


/* Needed after demo, make into different lambda function??
// Authorization
api_gateway.get('/auth', function(req){
     var code = req.queryString.code;
     var state = req.queryString.state;
     var query = {
         client_id: CLIENT_ID,
         client_secret: CLIENT_SECRET,
         code: code
     };
     query = qs.stringify(query);
     return SLACK_AUTH + "?" + query;
}, {
        success: {code: 302}
     }
 );
// UNUSED FOR NOW
api_gateway.get('/auth2', function(req){
     var error = req.queryString.error;
     if(error != undefined){
        //Handle error here
     }
     // Store bot user token
     else{
         var json = JSON.parse(req.body);
         var bot_id = json.bot.bot_user_id;
         var bot_access_token = json.bot.bot_access_token;
         process.env.BOT_TOKEN = bot_access_token;
     }
 });
 */

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
    var res = pickResponse(userMsg);
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

// AI.api call
function aiQuery(phrase){
    var response = "Error!";
    var ai = "";
    var query = {
        v: '20150910',
        query: phrase,
        lang: 'en',
        sessionId: '1234'
    };
    var addr = "https://api.api.ai/v1/query" + "?" + qs.stringify(query);
    // DEMO ONLY - synchronous call
    ai = http_request('GET', addr, {
        'headers': {
            'Authorization': 'Bearer 6faa8c514cb742c59ab1029ce3f48bc7'
        }
    });
    try {
        response = JSON.parse(ai.body);
        response = response.result.fulfillment.speech;
    }
    catch (err) {
        response = "Sorry, there was an error accessing my AI.\n" + err;
    }

    return response;
}

// Decide what kind of question the user asked
// Or if it's a statement
function pickResponse(arg){
    var array = parseInput(arg);
    var first = array[0].toString().toLowerCase();
    var response;

    if(isAWSCommand(first)){
        response = commandList.AWSCommands[first];
    }
    // Lets first check if it's a command to save on computation time
    else if(isCommand(first)){
        response = commandList.commands[first];
    }
    // Hit API.ai for a response
    else {
        response = aiQuery(arg);
        // If an API.ai intent turned this into a command
        response = isCommand(response) ? commandList.commands[response] : response;
    }

    return response;
}

// Clean and splice input.
function parseInput(message){
    message = message.replace(new RegExp('\\.', 'g'), "");
    message = message.replace(new RegExp('!', 'g'), "");
    message = message.replace(new RegExp(',', 'g'), "");
    message = message.replace(new RegExp('\\?', 'g'), "");

    return message.split(" ");
}

function isCommand(firstWord){
    var res = false;
    if(commandList.commands[firstWord] !== undefined){
        res = true;
    }

    return res;
}

// If the command requires a fetch from AWS
function isAWSCommand(firstWord){
    var res = false;
    if(commandList.AWSCommands[firstWord] !== undefined){
        res = true;
    }

    return res;
}

// Commands
function listCommands(){
    var str = "";
    for(var key in helpList){
        if (helpList.hasOwnProperty(key)){
            str += key + "\t\t" + helpList[key] + "\n";
        }
    }
    return "Here are my available commands:\n" + toCodeBlock(str);
}

// Turn string into slack codeblock
function toCodeBlock(str){
    // triple back ticks for code block
    var backticks = "```";
    return backticks + str + backticks;
}


// Server up or down (EC2 Only)
let getStatus = function() {
    return new Promise(function (resolve, reject) {

        var slackMsg = new SlackTemplate();

        var params = {
            DryRun: false
        };

        ec2.describeInstances(params, function (err, data) {
            if (err) {
                reject(errorMessage(err.message));
            } else {
                var res = data.Reservations;

                res.forEach(function(reservation){
                    var instance = reservation.Instances;
                    instance.forEach(function(inst){
                        var msg = "";
                        var state = inst.State.Name.toString();
                        var name = getEC2Name(inst);
                        var id = inst.InstanceId;

                        slackMsg.addAttachment(getAttachNum());

                        msg += name + " (" + id + ")" + " is " + state;
                        if(state === EC2_ONLINE){
                            msg += " since " + inst.LaunchTime;
                            slackMsg.addColor(SLACK_GREEN);
                        }
                        else if (state === EC2_OFFLINE || state === EC2_TERM){
                            slackMsg.addColor(SLACK_RED);
                        }
                        else{
                            slackMsg.addColor(SLACK_YELLOW);
                        }
                        msg += ".\n\n";
                        slackMsg.addText(msg);
                    });
                });
                resolve(slackMsg);
            }
        });


    });
};

// Get the state of all AMI images owned by user.
// Finds all images used by the users instances and gets status of those instances.
let getAMIStatus = function(){
    return new Promise(function (resolve, reject) {

        var slackMsg = new SlackTemplate();

        var paramsInst = {
            DryRun: false
        };

        ec2.describeInstances(paramsInst, function (err, data) {

            var imageList = [];

            var res = data.Reservations;

            // Extract images from JSON instance info
            res.forEach(function(reservation){
                var instances = reservation.Instances;
                instances.forEach(function(inst){
                    var name = inst.ImageId;
                    if(imageList.indexOf(name) <= -1)
                        imageList.push(name);
                });
            });

            if(imageList.length <= 0){
                var errMsg = "No AMIs found.";
                slackMsg.addAttachment(getAttachNum());
                slackMsg.addText(errMsg);
                resolve(slackMsg);
            }
            else {
                var paramsImg = {
                    DryRun: false,
                    ImageIds: imageList
                };

                ec2.describeImages(paramsImg, function (err, data) {
                    if (err) {
                        reject(errorMessage(err.message));
                    }
                    else {
                        var images = data.Images;

                        images.forEach(function (image) {
                            var name = image.Name;
                            var state = image.State;
                            var msg = "";

                            slackMsg.addAttachment(getAttachNum());

                            msg += name + " is " + state + ".";

                            if (state === AMI_AVBL) {
                                slackMsg.addColor(SLACK_GREEN);
                            }
                            // Include reason if not available.
                            else {
                                var code = image.StateReason.Code;
                                var reason = image.StateReason.Message;
                                var color = (state === AMI_PEND) ? SLACK_YELLOW : SLACK_RED;
                                msg += "\n" +
                                    "Reason: " +
                                    reason +
                                    "(Code: " + code + ")";
                                slackMsg.addColor(color);
                            }
                            msg += "\n\n";
                            slackMsg.addText(msg);
                        });
                        resolve(slackMsg);
                    }
                });
            }

        });
    });
};

// Get the name of an EC2 instance
function getEC2Name(instance){
    var tags = instance.Tags;
    var name = "Unknown";
    tags.forEach(function(tag){
        if(tag.Key === "Name"){
            name = tag.Value;
        }
    });

    return name;
}

// Get next attachment number
function getAttachNum(){
    attachNum++;
    return attachNum.toString();
}

// Error message formater
function errorMessage(text){
    var str = 'Error: \n' + text.toString();
    return new SlackTemplate().
        addAttachment("err").
        addColor(SLACK_RED).
        addText(str);
}

module.exports = api;

// Commands with description
var helpList = {
    help: "Lists available commands.",
    man: "Display user manual.",
    cpu: "Current server CPU usage.",
    ram: "Current server memory allocation.",
    status: "Server Online/Offline status.",
    disk: "Amount of data stored on server bucket.",
    jobs: "Number of jobs run today between all servers.",
    health: "Overall percentage of uptime vs downtime of the server"
};

// Response commandList
var commandList = {
    // Add commands here that do not gather data from AWS
    commands:{
        help: listCommands(),
        man: "Sorry, I have not been given a user manual yet.",
        cpu: "CPU usage is currently at 62%.",
        ram: "There is 2.67GB of memory available. 29.33GB is currently occupied.",
        disk: "The storage bucket has 189GB of data.",
        jobs: "A total of 34 jobs were run today on the Test, Development and Production servers.",
        health: "Server health is currently very good, at 98%. " +
        "\nThe server was down last on Oct 29, 2016 - 9:47am for 2 hours and 11 minutes."
    },

    // Add new AWS commands here
    AWSCommands:{
        status: getStatus(),
        ami: getAMIStatus()
    }
};