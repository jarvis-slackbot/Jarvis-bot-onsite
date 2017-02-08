/*
    AWS CloudWatch
 */
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const msg = require('./message.js');
const aws = require('aws-sdk');
const cw = new aws.CloudWatch({region: 'us-west-2', maxRetries: 15,apiVersion: '2010-08-01'});

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
            var params = {
                Dimensions: [
                    {
                        Name: 'InstanceId',
                    },
                ],
                MetricName: 'CPUUtilization',
                Namespace: 'AWS/EC2'
            };

            // List instances that have metrics
            cw.listMetrics(params, function(err, data){

                if (err){
                    reject(msg.errorMessage(err.message));
                } else {
                    var instanceList = [];
                    var metrics = data.Metrics;

                    // Get all instance names
                    metrics.forEach(function(met){
                        var name = met.Dimensions[0].Value;
                        if (instanceList.indexOf(name) <= -1)
                            instanceList.push(name);
                    });

                    if (instanceList.length <= 0) {
                        var errMsg = "No Instances found.";
                        slackMsg.addAttachment(msg.getAttachNum());
                        slackMsg.addText(errMsg);
                        resolve(slackMsg);

                    } else {
                        // Get CPU for each instance
                        instanceList.forEach(function (instName) {

                            var instParams = {
                                EndTime: date,
                                MetricName: 'CPUUtilization',
                                Namespace: 'AWS/EC2',
                                Period: CPU_INTERVAL * 60,    // Seconds
                                StartTime: date2,
                                Dimensions: [
                                    {
                                        Name: 'InstanceId',
                                        Value: instName.toString()
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

                                    // TODO - get instance name (ANOTHER API call? Switch to EC2 describe call?)

                                    // Server is offline or terminated
                                    if(!dataPoint){
                                        text = "INSTANCENAME" + "(" + instName + "):" +
                                            " No CPU data found.";
                                        slackMsg.addColor(msg.SLACK_RED);
                                    // Server online
                                    } else {
                                        var average = dataPoint.Average;
                                        var color = (average >= CPU_WARN) ? msg.SLACK_RED : msg.SLACK_GREEN;
                                        text = "INSTANCENAME" + "(" + instName + "):" +
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
                }

            });
        });
    }
};