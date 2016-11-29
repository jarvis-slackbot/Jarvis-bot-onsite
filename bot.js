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

const NAME = "{{name}}";
const QUESTION = "question";
const STATE = "statement";
const JARVIS = "jarvis";

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
    //message.addAttachment("A").addText(res);  // Attachment to message
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
        response = pickResponse(parseInput(arg));
        response = parseResponse(response);
    }
    return response;
}

// Decide what kind of question the user asked
// Or if it's a statement
function pickResponse(arg){
    var first = arg[0].toString().toLowerCase();
    var response;

    if(isCommand(first)){
        response = dictionary.commands[first];
    }
    // Statement or Question
    // Will not be very in-depth for 2016 demo
    else {
        response = getResponse(arg);
    }

    return response;
}

// Get type of message from keyword - assuming not a command
// Slapped together for demo until AI calls are used
function getResponse(arg){
    var response = "Hmm, something went wrong on my end.";
    var resultKey = undefined;

    // Get LAST instance of key
    for(var i = 0; i < arg.length; i++){
        var word = arg[i];
        for(var key in keyWords){
            if(keyWords.hasOwnProperty(key) && key.toString() === word) {
                resultKey = key;
            }
        }
    }

    switch(keyWords[resultKey]){
        case JARVIS:
            response = dictionary.questions.jarvis[resultKey];
            break;
        case QUESTION:
            response = dictionary.questions.unknown[
            Math.floor(Math.random() * Object.keys(dictionary.questions.unknown).length) + 1
                ];
            break;
        default:
            response = dictionary.statements.unknown[
            Math.floor(Math.random() * Object.keys(dictionary.statements.unknown).length) + 1
                ];
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
    return toCodeBlock(str);
}

// Turn string into slack codeblock
function toCodeBlock(str){
    // triple back ticks for code block
    var backticks = "```";
    return backticks + str + backticks;
}


module.exports = api;


// Keywords
var keyWords = {
    work: JARVIS,
    cost: JARVIS,
    who: QUESTION,
    what: QUESTION,
    where: QUESTION,
    when: QUESTION,
    how: QUESTION
};

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
// TEMP for demo - Turn into AI api calls in future
var dictionary = {
    questions: {
        jarvis:{
            work: "I exist in an AWS Lambda function, currently in demo form. I wake up when you send me a message " +
                    "and think of a clever response. After I respond, I go to sleep again to save on usage costs.",
            cost: "I'm free! Unless you ask me more then a million questions per month..."
        },
        unknown: {
            1: "Sorry "+ NAME +", I don't know how to answer that.",
            2: "Please try asking your question again.",
            3: "I'm not smart enough to answer that yet!"
        }
    },

    statements: {

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