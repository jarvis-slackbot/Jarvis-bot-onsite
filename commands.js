/*
    Handles parsing commands and command arguments
 */

const commandLineArgs = require('command-line-args');


// Parse command and get select appropriate function
// Param message is array of command line args (message[0] being command itself)
exports.parseCommand = function(message){
    var first = message[0].toString();
    var func;

    if(isAWSCommand(first)){
        func = getAWSCommand(first).Function;
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
            Function: require('./ec2.js').getStatus(),
            Description: "Server Online/Offline status."
        },
        {
            Name: "ami",
            Function: require('./ec2.js').getAMIStatus(),
            Description: "Amazon Machine Image (AMI) status information."
        },
        {
            Name: "ec2cpu",
            Function: require('./cloudwatch').getEc2Cpu(),
            Description: "Current server CPU usage."
        },
        {
            Name: "ec2disk",
            Function: require('./cloudwatch').getEc2Disk(),
            Description: "Amount of data stored on server bucket."
        },
        {
            Name: "ec2network",
            Function: require('./cloudwatch').getEc2Network(),
            Description: "Ec2 network information."
        },
        {
            Name: "ec2info",
            Function: require('./ec2.js').getHardwareInfo(),
            Description: "Generic EC2 instance information."
        },
        {
            Name: "ec2net",
            Function: require('./ec2.js').getNetworkInfo(),
            Description: "Network information."
        },
        {
            Name: "health",
            Function: require('./health.js').getAWSHealth(),
            Description: "Overall percentage of uptime vs downtime of the server"
        },
        {
            Name: "ec2ebs",
            Function: require('./ec2.js').getEBSInfo(),
            Description: "EC2 attached EBS (Elastic Bloc Storage) volume information."
        }
    ]
};