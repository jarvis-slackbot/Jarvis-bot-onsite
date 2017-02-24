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

const DEFAULT_TIME = 5; // In minutes. IF aws user has detailed metrics enabled, minimum value is 1. Else, minimum is 5.
const CPU_WARN = 80.0;  // CPU percent value >= to issue warning color

module.exports = {

    // EC2 --------------------------------------------------

    // CPU
    getEc2Cpu: function(options){
        return new Promise(function (resolve, reject) {

            var slackMsg = new SlackTemplate();

            // Date/Time of request (Date object created in milliseconds)
            var date = new Date(Date.now());
            var date2 = new Date(Date.now() - ((DEFAULT_TIME * 60) * 1000));

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
                            Period: DEFAULT_TIME * 60,    // Seconds
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
                                    var average = dataPoint.Average;
                                    var color = (average >= CPU_WARN) ? msg.SLACK_YELLOW : msg.SLACK_GREEN;
                                    text +=
                                        "CPU averaged " + average + "% in the last " +
                                        DEFAULT_TIME + " minutes.\n";
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
    getEc2Network: function() {
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();

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

                        var id = inst.InstanceId;
                        var name = ec2.getEC2Name(inst);

                        var instParams = {
                            EndTime: date,
                            MetricName: 'NetworkIn',
                            Namespace: 'AWS/EC2',
                            Period: DEFAULT_TIME * 60,
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
                                                    '\nAverage Network Usage in the last ' + CPU_INTERVAL + ' minutes:' +
                                                    "\nNetwork usage In: " + networkIn + networkInType +
                                                    "\nNetwork usage Out: " + networkOut + networkOutType;

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
    getEc2Disk: function() {
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();

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
                                Period: DEFAULT_TIME * 60,
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
                                        Period: DEFAULT_TIME * 60,
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
                                                writeData.Datapoints[0] / (DEFAULT_TIME * 60) : "Not found";
                                            var readOps = readData.Datapoints[0] ?
                                                readData.Datapoints[0] / (DEFAULT_TIME * 60) : "Not found";

                                            if(writeOps === "Not found" && readOps === "Not found"){
                                                slackMsg.addColor(msg.SLACK_RED);
                                                text += "No data found.\n"
                                            }
                                            else {
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

// Pass in entire argument object from user
// Returns start time in ms
function getTime(args){
    var value = args.time;
    var ms;

    // TODO - error checking
    if(args.minutes){
        ms = (value * 60) * 1000;
    }
    else if(args.hours){
        ms = (value * 60 * 60) * 1000;
    }
    else if(args.days){
        ms = (value * 3600 * 24) * 1000
    }
    // Use default time
    else{
       ms = (DEFAULT_TIME * 60) * 1000;  // Minutes
    }

    return ms;
}