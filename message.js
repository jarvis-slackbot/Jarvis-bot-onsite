/*
    Message handle/formatter module
 */

var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const ai = require('./ai.js');

// Attachment number
var attachNum = 0;

module.exports = {
    // Slack colors
    SLACK_GREEN: 'good',
    SLACK_YELLOW: 'warning',
    SLACK_RED: 'danger',

    // Decide what kind of question the user asked
    // Or if it's a statement/command
    pickResponse: function(arg){
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
            response = ai.aiQuery(arg);
            // If an API.ai intent turned this into a command
            response = isCommand(response) ? commandList.commands[response] : response;
        }

        return response;
    },

    // Get next attachment number
    getAttachNum: function() {
        attachNum++;
        return attachNum.toString();
    },

    // Error message formater
    errorMessage: function(text) {
        var str = 'Error: \n' + text.toString();
        return new SlackTemplate().addAttachment("err").addColor(this.SLACK_RED).addText(str);
    }

 };

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

// Clean and splice input.
function parseInput(message){
    message = message.replace(new RegExp('\\.', 'g'), "");
    message = message.replace(new RegExp('!', 'g'), "");
    message = message.replace(new RegExp(',', 'g'), "");
    message = message.replace(new RegExp('\\?', 'g'), "");

    return message.split(" ");
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


// Commands with description
var helpList = {
    help: "Lists available commands.",
    man: "Display user manual.",
    cpu: "Current server CPU usage.",
    ram: "Current server memory allocation.",
    status: "Server Online/Offline status.",
    disk: "Amount of data stored on server bucket.",
    jobs: "Number of jobs run today between all servers.",
    health: "Overall percentage of uptime vs downtime of the server",
    ami: "Amazon Machine Image (AMI) status information."
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
        status: require('./ec2.js').getStatus(),
        ami: require('./ec2.js').getAMIStatus()
    }
};