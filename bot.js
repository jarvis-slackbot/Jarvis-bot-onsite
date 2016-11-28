// API builder to create AWS API Gateways
var ApiBuilder = require("claudia-api-builder");
const qs = require('querystring');
const aws = require('aws-sdk');
const promiseDelay = require('promise-delay');
var api = new ApiBuilder();
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;

const lambda = new aws.Lambda();

const SLACK_AUTH = "https://slack.com/api/oauth.access";
const CLIENT_ID = "81979454913.97303513202";
const CLIENT_SECRET = "ab85e84c73978ce51d8e28103de895d9";
const SCOPES = "bot";  // Space separated
const TOKEN = "5aPJyd1E0IrszzWpRCBl0LnS";

var name = "";

// Authorization
api.get('/auth', function(req){
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
api.get('/auth2', function(req){
    var error = req.queryString.error;
    if(error != undefined){
        // TODO Handle error here
    }
    // Store bot user token
    else{
        var json = JSON.parse(req.body);
        var bot_id = json.bot.bot_user_id;
        var bot_access_token = json.bot.bot_access_token;
        process.env.BOT_TOKEN = bot_access_token;
    }

});

// User command entry point
api.post('/jarvis', function(req){
    var command = req.post.text;    // Users command (Everything after /jarvis)
    name = req.post.user_name;      // Users slack name
    var res = parseUserCommand(command);
    var message = new SlackTemplate(res);
    return message.channelMessage(true).get();
});

// Parse user command and formulate response
function parseUserCommand(arg){
    var response = "Error: Command not found.";
    // Empty arg?
    if(arg === undefined || arg === null || arg === ""){
        response = "Error: Your arg was empty.";
    }
    // Valid user arg
    else{
        response = pickResponse(arg.split(" "));
        response = parseResponse(response);
    }
    return response;
}

// Decide what kind of question the user asked
// Or if it's a statement
function pickResponse(arg){
    var first = arg[0].toString().toLowerCase();
    var response = "Hmm, something went wrong on my end.";

    if(isCommand(first)){
        response = dictionary.commands[first];
    }
    // Statement or Question
    // Will not be very in-depth for 2016 demo
    else {
        // Question
        if (first === "what" ||
            first === "why" ||
            first === "when" ||
            first === "how" ||
            first === "where") {
            // TODO - clean this up
            response = dictionary.questions.unknown[Math.floor(Math.random() * 3) + 1]
        }
        // Statement
        else{
            response = dictionary.statements.unknown[Math.floor(Math.random() * 3) + 1]
        }
    }

    return response;
}

function parseResponse(response){
    response = response.replace(new RegExp("{{name}}", 'g'), name);
    return response;
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
    return toCodeBlock(str);
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
    disk: "Amount of data stored on server bucket."
};

// Response dictionary
var dictionary = {
    questions: {

        unknown: {
            1: "Sorry {{name}}, I don't know how to answer that.",
            2: "Please try asking your question again.",
            3: "I'm not smart enough to answer that yet!"
        }
    },

    statements: {

        unknown: {
            1: "Sorry {{name}}, I don't know what that means.",
            2: "...",
            3: "..."
        }
    },

    commands:{
        help: listCommands(),
        man: "Sorry {{name}}, I have not been given a user manual yet.",
        cpu: "CPU usage is currently at 62%.",
        ram: "There is 2.67GB of memory available. 29.33GB is currently occupied.",
        status: "The server is online.",
        disk: "The storage bucket has 189GB of data."
    }
};

