/*
    AWS CloudWatch
 */
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const msg = require('./message.js');
const aws = require('aws-sdk');
const cw = new aws.CloudWatch({region: 'us-west-2', maxRetries: 15,apiVersion: '2010-08-01'});
const ec2 = require('./ec2.js');

const CPU_INTERVAL = 5; // In minutes. IF aws user has detailed metrics enabled, minimum value is 1. Else, minimum is 5.
const CPU_WARN = 80.0;  // CPU percent value >= to issue warning color

module.exports = {

    // EC2 --------------------------------------------------

    // CPU
    getEc2Cpu: function(){
        return new Promise(function (resolve, reject) {

            var slackMsg = new SlackTemplate();

            // Date/Time of request (Date object created in milliseconds)
            var date = new Date(Date.now());
            var date2 = new Date(Date.now() - ((CPU_INTERVAL * 60) * 1000));

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
                            Period: CPU_INTERVAL * 60,    // Seconds
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
                                var text;
                                slackMsg.addAttachment(msg.getAttachNum());

                                // Server is offline or terminated
                                if(!dataPoint){
                                    text = name + "(" + id + "):" +
                                        " No CPU data found.";
                                    slackMsg.addColor(msg.SLACK_RED);
                                // Server online
                                } else {
                                    var average = dataPoint.Average;
                                    var color = (average >= CPU_WARN) ? msg.SLACK_YELLOW : msg.SLACK_GREEN;
                                    text = name + "(" + id + "):" +
                                        " CPU averaged " + average + "% in the last " +
                                        CPU_INTERVAL + " minutes.";
                                    slackMsg.addColor(color);
                                }

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
            var date2 = new Date(Date.now() - ((CPU_INTERVAL * 60) * 1000));

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
                            Period: CPU_INTERVAL * 60,
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
                                var text;
                                slackMsg.addAttachment(msg.getAttachNum());

                                instParams.MetricName = 'NetworkOut';

                                cw.getMetricStatistics(instParams, function (err, data) {
                                    if (err) {
                                        reject(msg.errorMessage(JSON.stringify(err)));
                                    } else {
                                        var dataPointOut = data.Datapoints[0];
                                        var text;
                                        slackMsg.addAttachment(msg.getAttachNum());
                                        if (!dataPoint) {
                                            text = name + "(" + id + "):" +
                                                " No Network data available.";
                                            slackMsg.addColor(msg.SLACK_RED);
                                        } else {
                                            var networkIn = dataPoint.Average;
                                            var networkOut = dataPointOut.Average;
                                            var networkInType;
                                            var networkOutType;
                                            if(networkIn > 1000000) {
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

                                            if(networkOut > 1000000) {
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
                                                text = name + "(" + id + "): " +
                                                    "\nNetwork usage In: " + networkIn + networkInType +
                                                    "\nNetwork usage Out: " + networkOut + networkOutType;

                                            slackMsg.addColor(msg.SLACK_GREEN);
                                        }

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


    //Disk
    getEc2Disk: function() {
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();

            //Date + Time of request
            var date = new Date(Date.now());
            var date2 = new Date(Date.now() - ((CPU_INTERVAL * 60) * 1000));

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
                        var text = "";

                        var readParams = {
                            EndTime: date,
                            MetricName: 'DiskReadOps',
                            Namespace: 'AWS/EC2',
                            Period: CPU_INTERVAL * 60,
                            StartTime: date2,
                            Dimensions: [{
                                    Name: 'InstanceId',
                                    Value: id
                                },

                            ],
                            Statistics: [
                                'Average'
                            ],
                        };

                        cw.getMetricStatistics(readParams, function(err, data) {

                            if (err) {
                                reject(msg.errorMessage(JSON.stringify(err)));
                            } else {
                                var dataPoint = data.Datapoints[0];
                                if (dataPoint) {
                                    var diskVal = dataPoint.Average / (CPU_INTERVAL * 60);
                                    text = name + "(" + id + "):\n" +
                                        "Operation Count in last 5 minutes:\n"+ 
                                        "Read Operations: " + diskVal + " ops/s.\n";
                                }
                                
                                var writeParams = {
                                    EndTime: date,
                                    MetricName: 'DiskWriteOps',
                                    Namespace: 'AWS/EC2',
                                    Period: CPU_INTERVAL * 60,
                                    StartTime: date2,
                                    Dimensions: [{
                                        Name: 'InstanceId',
                                        Value: id
                                    },

                                    ],
                                    Statistics: [
                                        'Average'
                                    ],
                                };
                        
                                cw.getMetricStatistics(writeParams, function(err, data) {
                            
                                if (err) {
                                    reject(msg.errorMessage(JSON.stringify(err)));
                                } else {
                                    var dataPoint = data.Datapoints[0];
                                    slackMsg.addAttachment(msg.getAttachNum());

                                    if (!dataPoint) {
                                        text = name + "(" + id + "):" +
                                            " No Disk data found.";
                                        slackMsg.addColor(msg.SLACK_RED);
                                    } else {
                                        var diskVal = dataPoint.Average / (CPU_INTERVAL * 60);
                                        text = text + "Write Operations: " + diskVal + " ops/s.\n";
                                        slackMsg.addColor(msg.SLACK_GREEN);
                                    }    
                                
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
    }
};