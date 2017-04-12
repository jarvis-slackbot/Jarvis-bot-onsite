/*
    Handles parsing commands and command arguments
 */
'use strict';

const commandLineArgs = require('command-line-args');
const stringSimilarity = require('string-similarity');
const commandList = require('./commands_list').commandList;
let columnify = require('columnify');

const DEFAULT_HELP_SPACING = 40;
const OPTIONS_HEADING = 'OPTIONS';
const EXAMPLES_HEADING = 'EXAMPLES';
const COMMANDS_HEADING = 'COMMANDS';
const EC2_SECTION = 'EC2';
const S3_SECTION = 'S3';

const SIMILARITY_VALUE = 0.5;
const MAX_CMD_SUGGESTIONS = 5;


// Parse command and get select appropriate function
// Param message is array of command line args (message[0] being command itself)
// Returns string or a promise that resolves a SlackTemplate
exports.parseCommand = function(message){
    var first = message[0].toString();
    var func;
    var cmd;
    message.splice(0,1); // remove command to get arguments

    if(isAWSCommand(first)){
        cmd = getAWSCommand(first);
        // If there are arguments, pass them along to function
        if(hasArguments(cmd)){
            try {
                var options = listEmpty(message) ? null
                    : commandLineArgs(cmd.Arguments, {argv: message});
                if(options && options.help){
                    func = helpForAWSCommand(first);
                }
                else{
                    func = cmd.Function(options);
                }
            } catch(err){
                // Must return a promise for proper message handling
                func = new Promise(function(resolve, reject){
                    if (err.name === "UNKNOWN_OPTION"){
                        var preparedText = "";
                        //suggest most similar existing flag to the user's passed flag for their AWS command                        
                        let cmd_flagNamesArray = []; //will hold '--flagName'
                        cmd.Arguments.forEach((flag)=>{
                            cmd_flagNamesArray.push("--" + flag.name);
                        });
                        let bestFlagMatch = (stringSimilarity.findBestMatch(message[0], cmd_flagNamesArray)).bestMatch.target;
                        preparedText += "\nDid you mean: " + bestFlagMatch;

                        //crates slacktemplate to hold the message. Final slack edit ends here.
                        var msg = require('./message.js').errorMessage(
                            "Argument error: " + err.name + 
                            "\nSuggestion: Please use the --help flag for a list of valid arguments."
                            + preparedText);
                    }
                    else {
                        var msg = require('./message.js').errorMessage(
                            "Argument error: " + err.name
                        );
                    }
                    resolve(msg);
                });
            }

        }
        else{
            func = cmd.Function;
        }
    }
    // If it's a non aws command
    else if(isCommand(first)){
        func = isHelp(first) ? helpList() : getCommand(first).Function;
    }
    else{
        func = "Command parse error.";
    }

    return func;
};

exports.listSimilarCommands = function(first){
    let cmdList = getCommandList();
    let simList = [];

    cmdList.forEach(cmd => {
        let similarity = stringSimilarity.compareTwoStrings(cmd, first);
        if (similarity >= SIMILARITY_VALUE && simList.length < MAX_CMD_SUGGESTIONS) {
            simList.push(cmd);
        }
    });
    return simList;
};

exports.isCommand = function(message){
  return (isCommand(message) || isAWSCommand(message));
};

// Does this command has arguments?
function hasArguments(command){
    return !!(command.Arguments);
}


// If the command is the help command - Special case here
function isHelp(first){
    return commandList.commands[0].Name === first;
}

// Get normal command block
function getCommand(first){
    var res;
    commandList.commands.forEach((cmd)=>{
        if(cmd.Name === first){
            res = cmd;
        }
    });

    return res;
}

// Get AWS command block
function getAWSCommand(first){
    var res;
    commandList.AWSCommands.forEach((cmd)=>{
        if(cmd.Name === first){
            res = cmd;
        }
    });

    return res;
}
// Is a normal command
function isCommand(first){
    var res = false;
    commandList.commands.forEach((cmd)=>{
        if(cmd.Name === first){
            res = true;
        }
    });

    return res;
}

// If the command requires a fetch from AWS
function isAWSCommand(first){
    var res = false;
    commandList.AWSCommands.forEach((cmd)=>{
        if(cmd.Name === first){
            res = true;
        }
    });

    return res;
}

// Returns list of all commands
function getCommandList(){
    let resList = [];
    commandList.commands.forEach(cmd => {
        resList.push(cmd.Name);
    });
    commandList.AWSCommands.forEach(cmd => {
        resList.push(cmd.Name);
    });
    return resList;
}

// High level help for displaying commands
// /jarvis help directs here for output
function helpList(){
    let helpStr = '';
    let ec2Data = [];
    let s3Data = [];
    let otherData = [];
    let exData = [];

    commandList.commands.forEach((cmd)=>{
        otherData.push({
            Command: cmd.Name,
            Description: cmd.ShortDescription
        });
    });
    commandList.AWSCommands.forEach((awsCmd)=> {
        if (awsCmd.Section === EC2_SECTION){
            ec2Data.push({
                Command: awsCmd.Name,
                Description: awsCmd.ShortDescription
            });
        }
        else if(awsCmd.Section === S3_SECTION){
            s3Data.push({
                Command: awsCmd.Name,
                Description: awsCmd.ShortDescription
            });
        }
    });
    commandList.commands[0].Examples.forEach((ex) => {
        exData.push({
            Examples: ex
        })
    });

    let otherCmds = columnify(otherData,{
        minWidth: DEFAULT_HELP_SPACING,
        headingTransform: function(heading) {
            heading = '';
            return heading;
        }
    });

    let ec2Cmds = columnify(ec2Data,{
        minWidth: DEFAULT_HELP_SPACING,
        headingTransform: function(heading) {
            heading = '';
            return heading;
        }
    });

    let s3Cmds = columnify(s3Data,{
        minWidth: DEFAULT_HELP_SPACING,
        headingTransform: function(heading) {
            heading = '';
            return heading;
        }
    });

    let exStr = columnify(exData,{
        minWidth: DEFAULT_HELP_SPACING,
        headingTransform: function(heading) {
            heading = '';
            return heading;
        }
    });

    helpStr += 'HELP' + "\n\n" +
        commandList.commands[0].Description + "\n\n\n" +
        COMMANDS_HEADING + '\n' + otherCmds + '\n\n' +
        'EC2 Commands' + ec2Cmds + '\n\n' +
        'S3 Commands' + s3Cmds + '\n\n\n' +
        EXAMPLES_HEADING  + exStr;

    return "Here are my available commands:\n" + toCodeBlock(helpStr);
}

// Turn string into slack codeblock
function toCodeBlock(str){
    // triple back ticks for code block
    var backticks = "```";
    return backticks + str + backticks;
}
// Turn to slack bold
function bold(str){
    return '*' + str + '*';
}

function italic(str){
    return '_' + str + '_';
}

// Return true for empty list
function listEmpty(list){
    return !(typeof list !== 'undefined' && list.length > 0);
}

function multiplyString(str, num){
    return new Array(num + 1).join(str);
}

// Generates help output for a given command
function helpForAWSCommand(command){
    let helpStr = '';
    let argsData = [];
    let exData = [];
    let commandBlock = getAWSCommand(command);

    // Build arguments section
    commandBlock.Arguments.forEach((arg) => {
        let argsLeftStr = '';
        let argsRightStr = '';
        if(arg.alias){
            argsLeftStr += '-' + arg.alias + ', ';
        }
        argsLeftStr += '--' + arg.name + ' ';
        // If there is a type
        if(arg.type !== Boolean && arg.TypeExample){
            argsLeftStr += ' [' + arg.TypeExample + ']';
            // Double the length is required here for some reason??
        }
        argsRightStr += arg.ArgumentDescription;
        argsData.push({
            Argument: argsLeftStr,
            Description: argsRightStr
        });
    });

    // Build examples section
    commandBlock.Examples.forEach((example) => {
        exData.push({Examples: example});
    });

    let argsStr = columnify(argsData,{
        minWidth: DEFAULT_HELP_SPACING,
        truncate: true,
        headingTransform: function(heading) {
            heading = '';
            return heading;
        }
    });

    let exStr = columnify(exData,{
        minWidth: DEFAULT_HELP_SPACING,
        truncate: true,
        headingTransform: function(heading) {
            heading = '';
            return heading;
        }
    });

    let name = (commandBlock.Name).toUpperCase();
    // Build title and description with args
    helpStr += name + "\n\n" +
            commandBlock.Description + "\n\n\n" +
            OPTIONS_HEADING +
            argsStr + '\n\n\n' +
            EXAMPLES_HEADING  + exStr;

    return toCodeBlock(helpStr);
}
