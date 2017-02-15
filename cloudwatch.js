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

                        var instParams = {
                            EndTime: date,
                            MetricName: 'DiskReadBytes',
                            Namespace: 'AWS/EC2',
                            Period: CPU_INTERVAL * 60,
                            StartTime: date2,
                            Dimensions: [{
                                    Name: 'InstanceId',
                                    Value: id
                                },

                            ],
                            Statistics: [
                                'Maximum'
                            ]
                        };

                        cw.getMetricStatistics(instParams, function(err, data) {

                            if (err) {
                                reject(msg.errorMessage(JSON.stringify(err)));
                            } else {
                                var dataPoint = data.Datapoints[0];
                                var text;
                                slackMsg.addAttachment(msg.getAttachNum());

                                if (!dataPoint) {
                                    text = name + "(" + id + "):" +
                                        " No Disk Read data available.";
                                    slackMsg.addColor(msg.SLACK_RED);
                                } else {
                                    var diskVal = dataPoint.Maximum / 1000000000;
                                    text = name + "(" + id + "): " +
                                        " this storage bucket has " + diskVal + "GB of data in the last" +
                                        CPU_INTERVAL + " minutes.";
                                    slackMsg.addColor(msg.SLACK_GREEN);
                                }

                                slackMsg.addText(text);
                            }
                        });
                    });
                    resolve(slackMsg);
                }
            });
        });
    }
};