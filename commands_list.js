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
            Description: "Lists available commands. Commands are sub-divided into AWS sections. " +
            "To see more info on a specific command, use: \n /jarvis [command] --help\n\n" +
            "Please refer to the user manual for more extensive information of each command.",
            ShortDescription: "Lists available commands.",
            Examples: [
                "/jarvis [command]"
            ]
        }
    ],

    // Add new AWS commands here
    AWSCommands: [
        // EC2 status
        {
            Name: "ec2status",
            Function: require('./ec2.js').getStatus,
            Section: 'EC2',
            Description: "Instance health status. Shows current status information for the EC2 instances. " +
            "Instance State, System Status and Instance Status are provided.",
            ShortDescription: "Instance health status.", // Description for /help
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
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
            ],
            Examples: [
                "/jarvis ec2status",
                "/jarvis ec2status -t TagName",
                "/jarvis ec2Status -kt TagKey"
            ]
        },
        {
            Name: "ami",
            Function: require('./ec2.js').getAMIStatus,
            Section: 'EC2',
            Description: "Amazon Machine Image (AMI) status information. Image information for images " +
            "currently attached to an EC2 instance. Status is pending, available, invalid, deregistered, " +
            "transient, failed or error.",
            ShortDescription: "Amazon Machine Image (AMI) status information.", // Description for /help
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
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
                },
            ],
            Examples: [
                "/jarvis ami",
                "/jarvis ami -t TagName",
                "/jarvis ami -kt TagKey"
            ]
        },
        {
            Name: "ec2cpu",
            Function: require('./cloudwatch').getEc2Cpu,
            Section: 'EC2',
            Description:"Current server CPU usage. CPU usage is displayed as a percentage from 0 to 100%. " +
            "The usage data is an average of the CPU usage over a period of time. " +
            "The default time period is the last 5 minutes. " +
            "All time periods are the difference between current time and the time provided.",
            ShortDescription: "Current server CPU usage.",
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
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
                },
                {
                    name: 'minutes',
                    alias: 'm',
                    type: Number,
                    ArgumentDescription: "Sets data time period to specific minute value"
                },
                {
                    name: 'hours',
                    alias: 'h',
                    type: Number,
                    ArgumentDescription: "Sets data time period to specific hour value"
                },
                {
                    name: 'days',
                    alias: 'd',
                    type: Number,
                    ArgumentDescription: "Sets data time period to specific day value"
                }
            ],
            Examples: [
                "/jarvis ec2cpu",
                "/jarvis ec2cpu -t TagName",
                "/jarvis ec2cpu -kt TagKey",
                "/jarvis ec2cpu --minutes 30",
                "/jarvis ec2cpu --days 10",
                "/jarvis ec2cpu -kt TagKey --hours 5"
            ]
        },
        {
            Name: "ec2disk",
            Function: require('./cloudwatch').getEc2Disk,
            Section: 'EC2',
            Description: "Instance volume usage information. " +
            "Retrieves read/write IOPS (Input/Output Operations per Second). " +
            "The usage data is an average of the volume usage over a period of time. " +
            "The default time period is the last 5 minutes. " +
            "All time periods are the difference between current time and the time provided.",
            ShortDescription: "Instance volume usage information.",
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
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
                },
                {
                    name: 'minutes',
                    alias: 'm',
                    type: Number,
                    ArgumentDescription: "Sets data time period to specific minute value"
                },
                {
                    name: 'hours',
                    alias: 'h',
                    type: Number,
                    ArgumentDescription: "Sets data time period to specific hour value"
                },
                {
                    name: 'days',
                    alias: 'd',
                    type: Number,
                    ArgumentDescription: "Sets data time period to specific day value"
                }
            ],
            Examples: [
                "/jarvis ec2disk",
                "/jarvis ec2disk -t TagName",
                "/jarvis ec2disk -kt TagKey",
                "/jarvis ec2disk --minutes 30",
                "/jarvis ec2disk --days 10",
                "/jarvis ec2disk -kt TagKey --hours 5"
            ]
        },
        {
            Name: "ec2network",
            Function: require('./cloudwatch').getEc2Network,
            Section: 'EC2',
            Description: "Instance network usage information. " +
            "Retrieves size of data transferred in and out of the instance network. " +
            "The usage data is an average of the network usage over a period of time. " +
            "The default time period is the last 5 minutes. " +
            "All time periods are the difference between current time and the time provided.",
            ShortDescription: "Instance network usage information.",
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
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
                },
                {
                    name: 'minutes',
                    alias: 'm',
                    type: Number,
                    ArgumentDescription: "Sets data time period to specific minute value"
                },
                {
                    name: 'hours',
                    alias: 'h',
                    type: Number,
                    ArgumentDescription: "Sets data time period to specific hour value"
                },
                {
                    name: 'days',
                    alias: 'd',
                    type: Number,
                    ArgumentDescription: "Sets data time period to specific day value"
                }
            ],
            Examples: [
                "/jarvis ec2network",
                "/jarvis ec2network -t TagName",
                "/jarvis ec2network -kt TagKey",
                "/jarvis ec2network --minutes 30",
                "/jarvis ec2network --days 10",
                "/jarvis ec2network -kt TagKey --hours 5"
            ]
        },
        {
            Name: "ec2info",
            Function: require('./ec2.js').getHardwareInfo,
            Section: 'EC2',
            Description: "Generic EC2 instance information. Retrieves \"everyday\" information about an EC2 instance. " +
            "Instance ID, Attached AMI, Instance Type, Region and more are provided.",
            ShortDescription: "Generic EC2 instance information.",
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
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
            ],
            Examples: [
                "/jarvis ec2info",
                "/jarvis ec2info -t TagName",
                "/jarvis ec2info -kt TagKey"
            ]
        },
        {
            Name: "ec2net",
            Function: require('./ec2.js').getNetworkInfo,
            Section: 'EC2',
            Description: "Instance network information. Retrieves information about the instance network configuration." +
            "Instance ID, Network Status, Public IP, Private IP and more are provided.",
            ShortDescription: "Instance network information.",
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
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
            ],
            Examples: [
                "/jarvis ec2net",
                "/jarvis ec2net -t TagName",
                "/jarvis ec2net -kt TagKey"
            ]
        },
        {
            Name: "health",
            Function: require('./health.js').getAWSHealth(),
            Section: 'Other',
            Description: "Overall health status of the AWS system. This includes all AWS services.\n" +
            "WARNING: May not be available in some regions.",
            ShortDescription: "Overall health status of the AWS system.",
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
            ],
            Examples: [
                "/jarvis health"
            ]
        },
        {
            Name: "ec2ebs",
            Function: require('./ec2.js').getEBSInfo,
            Section: 'EC2',
            Description: "EBS (Elastic Block Storage) volume information. " +
            "Retrieves EBS information for volumes attached to an EC2 instance. " +
            "Volume Size, Region, Status, Encryption State and more are provided.",
            ShortDescription: "EBS (Elastic Block Storage) volume information.",
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
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
                },
                { // Get all volumes that are encrypted
                    name: 'encrypted',
                    alias: 'e',
                    type: Boolean,
                    ArgumentDescription: 'Flag to filter volumes by encryption state (encrypted only)'
                },
                { // Get all volumes that are not encrypted
                    name: 'not-encrypted',
                    alias: 'n',
                    type: Boolean,
                    ArgumentDescription: 'Flag to filter volumes by encryption state (non-encrypted only)'
                },
            ],
            Examples: [
                "/jarvis ec2ebs",
                "/jarvis ec2ebs -t TagName",
                "/jarvis ec2ebs -kt TagKey",
                "/jarvis ec2ebs --not-encrypted",
                "/jarvis ec2ebs -e",
                "/jarvis ec2ebs -nkt TagKey"
            ]
        },
        {
            Name: "ec2bytag",
            Function: require('./ec2.js').getByTag,
            Section: 'EC2',
            Description: "Lists instances by specified tag data. " +
            "Instance Name/ID provided for all instances that match the users filter criteria. " +
            "If no arguments are provided, then all instances will be listed.",
            ShortDescription: "Lists instances by specified tag data.",
            Arguments: [
                {
                    name: 'help',
                    type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                { // List ALL instances that have no tags
                    name: 'notags',
                    type: Boolean,
                    ArgumentDescription: 'Flag to filter results by instances that have no tags'
                },
                { // List instances that do not have the specified tag
                    name: 'notag',
                    alias: 'n',
                    type: String,
                    multiple: true,
                    ArgumentDescription: 'Filter results by instances that have a user specified tag'
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
                },
            ],
            Examples: [
                "/jarvis ec2bytag",
                "/jarvis ec2bytag -t TagName",
                "/jarvis ec2bytag -kt TagKey",
                "/jarvis ec2bytag --notags",
                "/jarvis ec2bytag --notag TagName",
                "/jarvis ec2bytag -kt TagKey -n TagName"
            ]
        },
        {
            Name: "s3bytag",
            Function: require('./s3.js').getS3Tags,
            Section: 'S3',
            Description: "Get buckets by tag.",
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {name: 'notags', type: Boolean}, // List ALL instances that have no tags
                {name: 'notag', alias: 'n', type: String, multiple: true}, // List instances that do not have the specified tag
                {name: 'tag', alias: 't', type: String, multiple: true, defaultOption: true} // List instances that have the specified tag
                //{name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ],
            Examples: []
        },
        {
            Name: "s3objects",
            Function: require('./s3.js').getS3BucketObject,
            Section: 'S3',
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
            ],
            Examples: []
        },
        {
            Name: "s3acl",
            //Function: require('./s3.js').getAcl(),
            Description: "Gets acl objects from buckets (Command in Progress).",
            Section: 'S3',
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ],
            Examples: []
        },
        {
            Name: "s3policy",
            Function: require('./s3.js').getBucketPolicy,
            Description: "Returns the JSON bucket policy.",
            Section: 'S3',
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'raw', alias: 'r', type: Boolean}, // Return raw json policy
            ],
            Examples: []
        },
        {
            Name: "s3info",
            Function: require('./s3.js').getBucketInfo,
            Description: "Generic bucket information.",
            Section: 'S3',
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean}, // Search by key instead of value
                {name: 'quick', alias: 'q', type: Boolean} // Skip getting bucket size to speed up this action
            ],
            Examples: []
        },
        {
            Name: "s3logging",
            Function: require('./s3.js').bucketLoggingInfo,
            Description: "Bucket logging information.",
            Section: 'S3',
            Arguments: [
                {name: 'help', type: Boolean,
                    ArgumentDescription: 'Displays this help information'
                },
                {name: 'name', alias: 'n', type: String, multiple: true}, // filter buckets by name
                {name: 'tag', alias: 't', type: String, multiple: true},
                {name: 'key', alias: 'k', type: Boolean} // Search by key instead of value
            ],
            Examples: []
        },
    ]
};