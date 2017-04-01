/*
    Holds command definitions
 */


// Response commandList
exports.commandList = {
    // Add commands here that do not gather data from AWS
    commands: [
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
    AWSCommands: [
        // EC2 status
        {
            Name: "ec2status",
            Function: require('./ec2.js').getStatus,
            Description: "Server Online/Offline status.", // Description
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {
                    name: 'tag',
                    alias: 't',
                    type: String,
                    multiple: true,
                    ArgumentDescription: 'Filter by tag name',
                    TypeExample: "tag_name"
                },
                {
                    name: 'key',
                    alias: 'k',
                    type: Boolean,
                    ArgumentDescription: 'Flag to filter by tag key instead of name'
                }
            ]
        },
        {
            Name: "ami",
            Function: require('./ec2.js').getAMIStatus,
            Description: "Amazon Machine Image (AMI) status information.",
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
        {
            Name: "ec2cpu",
            Function: require('./cloudwatch').getEc2Cpu,
            Description: "Current server CPU usage.",
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
        {
            Name: "ec2net",
            Function: require('./ec2.js').getNetworkInfo,
            Description: "Network information.",
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                // Sorters cannot be used with other sorters
                {
                    name: 'alpha',
                    alias: 'a',
                    type: Boolean
                }, // Sort alphabetically
                {
                    name: 'size',
                    alias: 's',
                    type: Boolean
                }, // Sort by size - largest to smallest
                {
                    name: 'date',
                    alias: 'd',
                    type: Boolean
                }, // Sort by date modified
                {
                    name: 'search',
                    type: String,
                    multiple: true
                }, // Filter objects list by users search word
                {
                    name: 'objtag',
                    type: String,
                    multiple: true
                }, // Objects by tag
                {
                    name: 'objkey',
                    type: Boolean
                }, // Objects by tag via key
                {
                    name: 'owner',
                    alias: 'o',
                    type: String,
                    multiple: true
                } // Objects by owner name (ONLY AVAILABLE IN SOME REGIONS)
            ]
        },
        {
            Name: "s3acl",
            //Function: require('./s3.js').getAcl(),
            Description: "Gets acl objects from buckets (Command in Progress).",
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
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
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ]
        },
    ]
};