/*
    Handles parsing commands and command arguments
 */

'use strict';

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

// Parse command and get select appropriate function
// Param message is array of command line args (message[0] being command itself)
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
                func = cmd.Function(options);
            } catch(err){
                // Must return a promise for proper message handling
                func = new Promise(function(resolve, reject){
                    var msg = require('./message.js').errorMessage(
                        "Argument error: " + err.name
                    );
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

// Return true for empty list
function listEmpty(list){
    return !(typeof list !== 'undefined' && list.length > 0);
}

// ------------------COMMANDS---------------------------

// Response commandList
const commandList = {
    // Add commands here that do not gather data from AWS
    commands:[
        {
            Name: "help",
            Function: "Cannot call myself!",
            Description: "Lists available commands.",
        },
        {
            Name: "man",
            Function: "Sorry, I have not been given a user manual yet.",
            Description: "Sorry, I have not been given a user manual yet."
        }
    ],

    // Add new AWS commands here
    AWSCommands:[
        {
            Name: "ec2status",
            Function: require('./ec2.js').getStatus,
            Description: "Server Online/Offline status.",
            Arguments: [
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
        {
            Name: "ami",
            Function: require('./ec2.js').getAMIStatus,
            Description: "Amazon Machine Image (AMI) status information.",
            Arguments: [
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'help', alias: 'h', type: String, multiple: true}
            ]
        },
        {
            Name: "ec2cpu",
            Function: require('./cloudwatch').getEc2Cpu,
            Description: "Current server CPU usage.",
            Arguments: [
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'minutes', alias: 'm', type: Number},
                {name: 'hours', alias: 'h', type: Number},
                {name: 'days', alias: 'd', type: Number}
            ]
        },
        {
            Name: "ec2disk",
            Function: require('./cloudwatch').getEc2Disk,
            Description: "Amount of data stored on server bucket.",
            Arguments: [
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'minutes', alias: 'm', type: Number},
                {name: 'hours', alias: 'h', type: Number},
                {name: 'days', alias: 'd', type: Number}
            ]
        },
        {
            Name: "ec2network",
            Function: require('./cloudwatch').getEc2Network,
            Description: "Ec2 network information.",
            Arguments: [
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'minutes', alias: 'm', type: Number},
                {name: 'hours', alias: 'h', type: Number},
                {name: 'days', alias: 'd', type: Number}
            ]
        },
        {
            Name: "ec2info",
            Function: require('./ec2.js').getHardwareInfo,
            Description: "Generic EC2 instance information.",
            Arguments: [
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
        {
            Name: "ec2net",
            Function: require('./ec2.js').getNetworkInfo,
            Description: "Network information.",
            Arguments: [
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
        {
            Name: "health",
            Function: require('./health.js').getAWSHealth(),
            Description: "Overall percentage of uptime vs downtime of the server"
        },
        {
            Name: "ec2ebs",
            Function: require('./ec2.js').getEBSInfo,
            Description: "EC2 attached EBS (Elastic Bloc Storage) volume information.",
            Arguments: [
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'encrypted', alias: 'e', type: Boolean}, // Get all volumes that are encrypted
                {name: 'not-encrypted', alias: 'n', type: Boolean}, // Get all volumes that are not encrypted
            ]
        },
        {
            Name: "ec2bytag",
            Function: require('./ec2.js').getByTag,
            Description: "Get list of instances by tag data",
            Arguments: [
                {name: 'notags', type: Boolean}, // List ALL instances that have no tags
                {name: 'notag', alias: 'n', type: String, multiple: true}, // List instances that do not have the specified tag
                {name: 'tag', alias: 't', type: String, multiple: true, defaultOption: true}, // List instances that have the specified tag
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
        {
            Name: "s3bytag",
            Function: require('./s3.js').getS3Tags,
            Description: "Get buckets by tag.",
            Arguments: [
                {name: 'notags', type: Boolean}, // List ALL instances that have no tags
                {name: 'notag', alias: 'n', type: String, multiple: true}, // List instances that do not have the specified tag
                {name: 'tag', alias: 't', type: String, multiple: true, defaultOption: true} // List instances that have the specified tag
                //{name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
        {
            Name: "s3objects",
            Function: require('./s3.js').getS3BucketObject,
            Description: "Return a list of objects in the bucket.",
            Arguments: [
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                // Sorters cannot be used with other sorters
                {name: 'alpha', alias: 'a', type: Boolean}, // Sort alphabetically
                {name: 'size', alias: 's', type: Boolean}, // Sort by size - largest to smallest
                {name: 'date', alias: 'd', type: Boolean}, // Sort by date modified
                {name: 'search', type: String, multiple: true}, // Filter objects list by users search word
                {name: 'objtag', type: String, multiple: true}, // Objects by tag
                {name: 'objkey', type: Boolean}, // Objects by tag via key
                {name: 'owner', alias:'o', type: String, multiple: true} // Objects by owner name (ONLY AVAILABLE IN SOME REGIONS)
            ], 
            Sections: [
                {
                    header: 'AMI usage info',
                    content: 'Generates something [italic]{very} important.'
                },
                {
                    header: 'Options',
                    optionList: [
                      {
                        name: 'flag',
                        typeLabel: '[underline]{file}',
                        description: 'Does flag stuff, and gets a file.'
                      },
                      {
                        name: 'flag2',
                        description: 'Does flag2 stuff.'
                      }
                    ]
                }
            ]
        },
        {
            Name: "s3acl",
            //Function: require('./s3.js').getAcl(),
            Description: "Gets acl objects from buckets (Command in Progress).",
            Arguments: [
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
        {
            Name: "s3policy",
            Function: require('./s3.js').getBucketPolicy,
            Description: "Returns the JSON bucket policy.",
            Arguments: [
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'raw', alias: 'r', type: Boolean}, // Return raw json policy
            ]
        },
        {
            Name: "s3info",
            Function: require('./s3.js').getBucketInfo,
            Description: "Generic bucket information.",
            Arguments: [
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'quick', alias: 'q', type: Boolean} // Skip getting bucket size to speed up this action
            ]
        },
        {
            Name: "s3logging",
            Function: require('./s3.js').bucketLoggingInfo,
            Description: "Bucket logging information.",
            Arguments: [
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
    ]
};