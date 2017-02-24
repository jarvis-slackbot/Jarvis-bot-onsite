/*
    Message handle/formatter module
 */

var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const cmd = require('./commands.js');
const ai = require('./ai.js');

// Attachment number
var attachNum = 0;


// Slack colors
exports.SLACK_GREEN = 'good';
exports.SLACK_YELLOW = 'warning';
exports.SLACK_RED = 'danger';
exports.SLACK_LOGO_BLUE = '#70CADB';
exports.SLACK_LOGO_PURPLE = '#443642';

// Decide what kind of question the user asked
// Or if it's a statement/command
exports.pickResponse = function(message){
    var response = "Pick Response Error";
    message = cleanInput(message);
    var first = message[0].toString();

    if(cmd.isCommand(first)){
        response = cmd.parseCommand(message);
    }
    else{
        response = first + ' is not a valid command.\n';
        // OLD AI code - Delete if decided to never implement AI
        //response = ai.aiQuery(arg);
        // If an API.ai intent turned this into a command
        //response = isCommand(response) ? commandList.commands[response] : response;
    }

    return response;
};

// Get next attachment number
exports.getAttachNum = function() {
    attachNum++;
    return attachNum.toString();
};

// Error message formater
exports.errorMessage = function(text) {
    var str = 'Error: \n' + text.toString();
    return new SlackTemplate().addAttachment("err").addColor(this.SLACK_RED).addText(str);
};

//Capitalize first letter
exports.capitalizeFirstLetter = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Put name and id in consistent title format
exports.toTitle = function(name, id){
    return name + ' (' + id + ')';
}

        //s3tags: require('./s3.js').getS3Tags(),
        //s3bucketobject: require('./s3.js').getS3BucketObject(),

// Clean and splice input.
function cleanInput(message){
    // Any clean input code here, otherwise just split
    return message.split(" ");
}
