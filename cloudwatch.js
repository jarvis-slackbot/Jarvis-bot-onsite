/*
    AWS CloudWatch
    API: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatch.html
 */
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const msg = require('./message.js');
const aws = require('aws-sdk');
const cw = new aws.CloudWatch({region: 'us-west-2', maxRetries: 15,apiVersion: '2010-08-01'});
const ec2 = require('./ec2.js');

const DEFAULT_TIME = 5; // In minutes.
const MIN_TIME = 5; // In minutes. IF aws user has detailed metrics enabled, minimum value is 1. Else, minimum is 5.
const CPU_WARN = 80.0;  // CPU percent value >= to issue warning color
const MINUTES = "Minutes";
const HOURS = "Hours";
const DAYS = "Days";
const DEFAULT_TIME_TYPE = MINUTES;
// The following is for the period setting of getMetricStatistics param
const MIN_PERIOD = 60; // In seconds
const PERIOD_15 = 15 * (3600 * 24); // In seconds, 15 days - the AWS period for first increase (to 5min)
const PERIOD_15_TIME = 5 * 60; // In seconds, 5 minutes
const PERIOD_63 = 63 * (3600 * 24); // In seconds, 15 days - the AWS period for last increase (to 1 hour)
const PERIOD_63_TIME = 60 * 60; // In seconds, 1 hour

module.exports = {

    // EC2 --------------------------------------------------

    // CPU
    getEc2Cpu: function(args){
        return new Promise(function (resolve, reject) {

            var slackMsg = new SlackTemplate();
            var timems = getTimeMs(args);
            var timeLabel = getTimeType(args);
            var time = getTimeByType(args, timeLabel);

            // Date/Time of request (Date object created in milliseconds)
            var date = new Date(Date.now());
            var date2 = new Date(Date.now() - timems);

            ec2.instList().then((instanceList) => {

                if (instanceList.length <= 0) {
                    var errMsg = "No Instances found.";
                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addText(errMsg);
                    resolve(slackMsg);

                } else {
                    // Get CPU for each instance
                    instanceList.forEach(function (inst) {

                        var id = inst.InstanceId;
                        var name = ec2.getEC2Name(inst);

                        var instParams = {
                            EndTime: date,
                            MetricName: 'CPUUtilization',
                            Namespace: 'AWS/EC2',
                            Period: getPeriod(timems),    // Seconds
                            StartTime: date2,
                            Dimensions: [
                                {
                                    Name: 'InstanceId',
                                    Value: id
                                },
                            ],
                            Statistics:[
                                'Average'
                            ]
                        };

                        cw.getMetricStatistics(instParams, function (err, data) {

                            if (err) {
                                reject(msg.errorMessage(JSON.stringify(err)));
                            } else {
                                var dataPoint = data.Datapoints[0];
                                var text = '';
                                slackMsg.addAttachment(msg.getAttachNum());

                                // Server is offline or terminated
                                if(!dataPoint){
                                    text +=
                                        "No CPU data found.";
                                    slackMsg.addColor(msg.SLACK_RED);
                                // Server online
                                } else {
                                    var average = round(dataPoint.Average);
                                    var color = (average >= CPU_WARN) ? msg.SLACK_YELLOW : msg.SLACK_GREEN;
                                    text +=
                                        "CPU averaged " + average + "% in the last " +
                                        time + " " + timeLabel + ".\n";
                                    slackMsg.addColor(color);
                                }
                                slackMsg.addTitle(msg.toTitle(name, id));
                                slackMsg.addText(text);
                            }
                        });
                    });
                    resolve(slackMsg);
                }
            });

        });
    },
    
// NETWORK
    getEc2Network: function(args) {
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();

            var timems = getTimeMs(args);
            var timeLabel = getTimeType(args);
            var time = getTimeByType(args, timeLabel);

            // Date/Time of request (Date object created in milliseconds)
            var date = new Date(Date.now());
            var date2 = new Date(Date.now() - timems);

            ec2.instList().then((instanceList) => {

                if (instanceList.length <= 0) {
                    var errMsg = "No instances found.";
                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addText(errMsg);
                    resolve(slackMsg);

                } else {

                    instanceList.forEach(function (inst) {

                        var id = inst.InstanceId;
                        var name = ec2.getEC2Name(inst);

                        var instParams = {
                            EndTime: date,
                            MetricName: 'NetworkIn',
                            Namespace: 'AWS/EC2',
                            Period: getPeriod(timems),
                            StartTime: date2,
                            Dimensions: [{
                                Name: 'InstanceId',
                                Value: id
                            },

                            ],
                            Statistics: [
                                'Average'
                            ]
                        };

                        cw.getMetricStatistics(instParams, function (err, data) {

                            if (err) {
                                reject(msg.errorMessage(JSON.stringify(err)));
                            } else {
                                var dataPoint = data.Datapoints[0];
                                slackMsg.addAttachment(msg.getAttachNum());

                                instParams.MetricName = 'NetworkOut';

                                cw.getMetricStatistics(instParams, function (err, data) {
                                    if (err) {
                                        reject(msg.errorMessage(JSON.stringify(err)));
                                    } else {
                                        var dataPointOut = data.Datapoints[0];
                                        var text = '';
                                        slackMsg.addAttachment(msg.getAttachNum());
                                        if (!dataPoint) {
                                            text +=
                                                "No Network data available.";
                                            slackMsg.addColor(msg.SLACK_RED);
                                        } else {
                                            var networkIn = dataPoint.Average;
                                            var networkOut = dataPointOut.Average;
                                            var networkInType;
                                            var networkOutType;
                                            if(networkIn >= 1000000) {
                                                networkInType = ' mb.';
                                                networkIn = networkIn/1000000;
                                            }
                                            else if(networkIn > 1000 ){
                                                networkInType = ' kb.';
                                                networkIn = networkIn/1000;
                                            }
                                            else{
                                                networkInType = ' bytes.';
                                            }

                                            if(networkOut >= 1000000) {
                                                networkOutType = ' mb.';
                                                networkOut = networkOut/1000000;
                                            }
                                            else if(networkOut > 1000 ){
                                                networkOutType = ' kb.';
                                                networkOut = networkOut/1000;
                                            }
                                            else{
                                                networkOutType = ' bytes.';
                                            }
                                                text +=
                                                    '\nAverage Network Usage in the last ' + time + ' ' + timeLabel + ':' +
                                                    "\nNetwork usage In: " + roundInt(networkIn) + networkInType +
                                                    "\nNetwork usage Out: " + roundInt(networkOut) + networkOutType;

                                            slackMsg.addColor(msg.SLACK_GREEN);
                                        }
                                        slackMsg.addTitle(msg.toTitle(name, id));
                                        slackMsg.addText(text);
                                    }
                                });
                            }
                        });
                    });
                    resolve(slackMsg);
                }
        });
    });
    },


    // Disk EBS usage
    getEc2Disk: function(args) {
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();

            var timems = getTimeMs(args);
            var timeLabel = getTimeType(args);
            var time = getTimeByType(args, timeLabel);

            //Date + Time of request
            var date = new Date(Date.now());
            var date2 = new Date(Date.now() - ((DEFAULT_TIME * 60) * 1000));

            ec2.instList().then((instanceList) => {
    
                if (instanceList.length <= 0) {
                    var errMsg = "No instances found.";
                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addText(errMsg);
                    resolve(slackMsg);
    
                } else {
                    instanceList.forEach(function (inst) {
                        var name = ec2.getEC2Name(inst);
                        var instId = inst.InstanceId;
                        var text = "";
                        var ebsList = ec2.getEBSVolumes(inst);
                        ebsList.forEach(function(devID){
                            var id = devID;
                            var readParams = {
                                EndTime: date,
                                MetricName: 'VolumeReadOps',
                                Namespace: 'AWS/EBS',
                                Period: getPeriod(timems),
                                StartTime: date2,
                                Dimensions: [{
                                    Name: 'VolumeId',
                                    Value: id
                                },

                                ],
                                Statistics: [
                                    'Average'
                                ],
                            };

                            cw.getMetricStatistics(readParams, function(err, writeData) {

                                if (err) {
                                    reject(msg.errorMessage(JSON.stringify(err)));
                                } else {

                                    var writeParams = {
                                        EndTime: date,
                                        MetricName: 'VolumeWriteOps',
                                        Namespace: 'AWS/EBS',
                                        Period: getPeriod(timems),
                                        StartTime: date2,
                                        Dimensions: [{
                                            Name: 'VolumeId',
                                            Value: id
                                        },

                                        ],
                                        Statistics: [
                                            'Average'
                                        ],
                                    };

                                    cw.getMetricStatistics(writeParams, function(err, readData) {

                                        if (err) {
                                            reject(msg.errorMessage(JSON.stringify(err)));
                                        } else {
                                            slackMsg.addAttachment(msg.getAttachNum()); // Attach for each instance
                                            var writeOps = writeData.Datapoints[0] ?
                                                writeData.Datapoints[0] / getPeriod(timems) : "Not found";
                                            var readOps = readData.Datapoints[0] ?
                                                readData.Datapoints[0] / getPeriod(timems) : "Not found";

                                            if(writeOps === "Not found" && readOps === "Not found"){
                                                slackMsg.addColor(msg.SLACK_RED);
                                                text += "No data found.\n"
                                            }
                                            else {
                                                text += 'Average Disk I/O operations in last ' + time +
                                                    ' ' + timeLabel + ':\n';
                                                text += 'Disk Read: ' + readOps + ' IOPS' + '\n' +
                                                        'Disk Write: ' + writeOps + ' IOPS' + '\n';
                                                slackMsg.addColor(msg.SLACK_GREEN);
                                            }
                                            slackMsg.addTitle(msg.toTitle(name, instId));
                                            slackMsg.addText(text);
                                        }
                                    });

                                }
                            });
                        });
                        
                    });
                    
                    resolve(slackMsg);
                }
            });
        });
    }
};

// Get user entered git time by type.
function getTimeByType(args, type){
    var value;

    // If no args, then go to default time setting
    if(!args){
        type = 'null';
    }

    switch (type) {
        case MINUTES:
            value = args.minutes;
            break;
        case HOURS:
            value = args.hours;
            break;
        case DAYS:
            value = args.days;
            break;
        default:
            value = DEFAULT_TIME;
    }
    return value;
}

// Pass in entire argument object from user
// Returns start time in ms
function getTimeMs(args){
    var value;
    var type = getTimeType(args);
    var ms;

    // If no args, then go to default time setting
    if(!args){
        type = 'null';
    }

    switch (type) {
        case MINUTES:
            value = args.minutes;
            value = value < MIN_TIME ? MIN_TIME : value;
            ms = (value * 60) * 1000;
            break;
        case HOURS:
            value = args.hours;
            ms = (value * 3600) * 1000;
            break;
        case DAYS:
            value = args.days;
            ms = (value * 3600 * 24) * 1000;
            break;
        default:
            ms = DEFAULT_TIME * 60 * 1000;

    }

    return ms;
}

// Return type of time
function getTimeType(args){
    var type;

    if(args) {
        if (args.hasOwnProperty('minutes')) {
            type = MINUTES;
        }
        else if (args.hasOwnProperty('hours')) {
            type = HOURS;
        }
        else if (args.hasOwnProperty('days')) {
            type = DAYS;
        }
        else{
            type = DEFAULT_TIME_TYPE;
        }
    }
    else{
        type = DEFAULT_TIME_TYPE;
    }

    return type;
}

// Period must be a multiple of MIN_PERIOD
// returns seconds
function getPeriod(timems){
    var period = Math.floor(timems / 1000); // put it into seconds
    if(timems < MIN_PERIOD) {
        period = MIN_PERIOD;
    }
    // Round period to 60 second interval
    // More or less extra safety, these values should ALWAYS be in 60 second intervals from user
    else if(period < PERIOD_15){
        period = period - (period % MIN_PERIOD);
    }
    // 15 day period
    else if(period < PERIOD_63){
        period = period - (period % PERIOD_15_TIME);
    }
    // 63 day period
    else{
        period = period - (period % PERIOD_63_TIME);
    }

    return period;

}

// Round to two decimal places
function round(avg){
    return +avg.toFixed(2);
}
// Round to 0 decimal places
function roundInt(avg){
    return +avg.toFixed(0);
}