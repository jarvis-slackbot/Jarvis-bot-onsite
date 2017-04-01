/*
    Handles parsing commands and command arguments
 */

'use strict';

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const commandList = require('./commands_list').commandList;

const DEFAULT_HELP_SPACING = 60;


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
                        var msg = require('./message.js').errorMessage(
                            "Argument error: " + err.name + "\nSuggestion: Please use the --help flag for a list of valid arguments."
                        );
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

// Commands
function helpList(){
    var str = "";
    commandList.commands.forEach((cmd)=>{
        str += cmd.Name + "\t\t" + cmd.Description + "\n";
    });
    commandList.AWSCommands.forEach((awsCmd)=>{
        str += awsCmd.Name + "\t\t" + awsCmd.Description + "\n";
    });
    return "Here are my available commands:\n" + toCodeBlock(str);
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
    let argsStr = '';
    let commandBlock = getAWSCommand(command);

    // Build arguments section
    commandBlock.Arguments.forEach((arg) => {
        let spacing = DEFAULT_HELP_SPACING; // for description spacing
        if(arg.alias){
            argsStr += '-' + arg.alias + ', ';
            spacing -= 4; // alias characters above
        }
        argsStr += '--' + arg.name + ' ';
        spacing -= (2 + arg.name.length);
        // If there is a type
        if(arg.type !== Boolean){
            argsStr += ' ' + italic(arg.TypeExample);
            spacing -= (arg.TypeExample.length + 1); // +1 for extra space on line above
            argsStr +=  ' ' + arg.TypeExample.length.toString();
        }
        argsStr += multiplyString(' ', spacing);
        argsStr += arg.ArgumentDescription;
        argsStr += '\n';
    });

    // Build title and description with args
    helpStr += '\n\n' +
        bold(commandBlock.Name) + "\n\n" +
            commandBlock.Description + "\n\n" +
            bold('Options') + '\n\n' +
            argsStr;

    return helpStr;
}