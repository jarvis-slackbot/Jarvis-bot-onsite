const qs = require('querystring');
const aws = require('aws-sdk');
var http = require('http');
var http_request = require('sync-request'); // DEMO ONLY
const promiseDelay = require('promise-delay');
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const slackDelayedReply = botBuilder.slackDelayedReply;


const lambda = new aws.Lambda();

const SLACK_AUTH = "https://slack.com/api_gateway/oauth.access";
const CLIENT_ID = "81979454913.97303513202";
const CLIENT_SECRET = "ab85e84c73978ce51d8e28103de895d9";
const SCOPES = "bot";  // Space separated
const TOKEN = "5aPJyd1E0IrszzWpRCBl0LnS";

const NAME = "{{name}}";
const QUESTION = "question";
const STATE = "statement";
const JARVIS = "jarvis";

var name = "";  // DEMO ONLY

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
        .catch(() => {
            return new SlackTemplate("Error!").get();
        });

});

api.intercept((event) => {
    if (!event.slackEvent) // if this is a normal web request, let it run
        return event;

    var data = event.slackEvent;
    var command = data.text;    // Users command (Everything after /jarvis)
    //name = event.slackEvent.user_name;      // Users slack name
    var res = parseUserCommand(command);
    if(res === undefined){
        res = "There was an error on my end - response undefined."
    }
    var message = new SlackTemplate(res);
    //message.addAttachment("A").addText(res);  // Attachment to message
    return promiseDelay(1000)
        .then(() => {
            return slackDelayedReply(data, message.channelMessage(true).get())
        })
        .then(() => false); // prevent normal execution
});

// AI.api call
function aiQuery(phrase){
    var response = "";
    var query = {
        v: '20150910',
        query: phrase,
        lang: 'en',
        sessionId: '1234'
    };
    var addr = "https://api.api.ai/v1/query" + "?" + qs.stringify(query);
    // DEMO ONLY - synchronous call
    response = http_request('GET', addr, {
        'headers': {
           'Authorization': 'Bearer 6faa8c514cb742c59ab1029ce3f48bc7'
        }
    });
    response = JSON.parse(response.body);
    response = response.result.fulfillment.speech;
    return response;
}

// Parse user command and formulate response
function parseUserCommand(arg){
    var response = "Error: Command not found.";
    response = pickResponse(arg);
    response = parseResponse(response);

    return response;
}

// Decide what kind of question the user asked
// Or if it's a statement
function pickResponse(arg){
    var array = parseInput(arg);
    var first = array[0].toString().toLowerCase();
    var response;

    if(arg === "" || arg === " "){
        response = dictionary.statements.empty;
    }
    // Lets first check if it's a command to save on computation time
    else if(isCommand(first)){
        response = dictionary.commands[first];
    }
    // Hit API.ai for a response
    else {
        response = aiQuery(arg);
        // If an API.ai intent turned this into a command
        response = isCommand(response) ? dictionary.commands[response] : response;
    }

    return response;
}

function parseResponse(response){
    return response.replace(new RegExp(NAME, 'g'), name);
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
    if(dictionary.commands[firstWord] !== undefined){
        res = true;
    }

    return res;
}

// Commands
function listCommands(){
    var str = "";
    for(var key in commandList){
        if (commandList.hasOwnProperty(key)){
            str += key + "\t\t" + commandList[key] + "\n";
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


module.exports = api;

// Commands with description
var commandList = {
    help: "Lists available commands.",
    man: "Display user manual.",
    cpu: "Current server CPU usage.",
    ram: "Current server memory allocation.",
    status: "Server Online/Offline status.",
    disk: "Amount of data stored on server bucket.",
    jobs: "Number of jobs run today between all servers.",
    health: "Overall percentage of uptime vs downtime of the server"
};

// Response dictionary
// TEMP for demo - Turn into AI api_gateway calls in future
var dictionary = {
    questions: {
        jarvis:{
            work: "I exist in an AWS Lambda function, currently in demo form. I wake up when you send me a message " +
                    "and think of a clever response. After I respond, I go to sleep again to save on usage costs.\n\n" +
                    "To communicate with me, type /jarvis then a command.\n" +
                    "Type:\n" + toCodeBlock("/jarvis help") + "\nfor more information.",
            cost: "I'm free! Unless you ask me more then a million questions per month..."
        },
        unknown: {
            1: "Sorry "+ NAME +", I don't know how to answer that.",
            2: "Please try asking your question again.",
            3: "I'm not smart enough to answer that yet!"
        }
    },

    statements: {

        empty: "To communicate with me, type /jarvis then a command.\n" +
        "Type:\n" + toCodeBlock("/jarvis help") + "\nfor more information.",
        unknown: {
            1: "Sorry "+ NAME +", I don't know what that means.",
            2: "I'm not sure how to respond to that.",
            3: "Can you please rephrase that? ",
            4: "Try using one of my commands. (/jarvis help)"
        }
    },

    commands:{
        help: listCommands(),
        man: "Sorry "+ NAME +", I have not been given a user manual yet.",
        cpu: "CPU usage is currently at 62%.",
        ram: "There is 2.67GB of memory available. 29.33GB is currently occupied.",
        status: "The server is online. It has been up for 24 days, 3 hours and 7 minutes.",
        disk: "The storage bucket has 189GB of data.",
        jobs: "A total of 34 jobs were run today on the Test, Development and Production servers.",
        health: "Server health is currently very good, at 98%. " +
                "\nThe server was down last on Oct 29, 2016 - 9:47am for 2 hours and 11 minutes."
    }
};