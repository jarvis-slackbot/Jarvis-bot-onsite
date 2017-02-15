/*
    AWS EC2
 */

var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const msg = require('./message.js');

// AWS EC2
const aws = require('aws-sdk');
const ec2Data = new aws.EC2({region: 'us-west-2', maxRetries: 15, apiVersion: '2016-11-15'});


// EC2 server states
const EC2_ONLINE = 'running';
const EC2_OFFLINE = 'stopped';
const EC2_TERM = 'terminated';

// AMI states
const AMI_AVBL = 'available';
const AMI_PEND = 'pending';

module.exports = {

// Server up or down (EC2 Only)
    getStatus: function () {
        return new Promise(function (resolve, reject) {

            var slackMsg = new SlackTemplate();

            var params = {
                DryRun: false
            };

            module.exports.instList().then((instancesList) => {

                instancesList.forEach(function (inst) {
                    var response = "";
                    var state = inst.State.Name.toString();
                    var name = module.exports.getEC2Name(inst);
                    var id = inst.InstanceId;

                    slackMsg.addAttachment(msg.getAttachNum());

                    response += name + " (" + id + ")" + " is " + state;
                    if (state === EC2_ONLINE) {
                        response += " since " + inst.LaunchTime;
                        slackMsg.addColor(msg.SLACK_GREEN);
                    }
                    else if (state === EC2_OFFLINE || state === EC2_TERM) {
                        slackMsg.addColor(msg.SLACK_RED);
                    }
                    else {
                        slackMsg.addColor(msg.SLACK_YELLOW);
                    }
                    response += ".\n\n";
                    slackMsg.addText(response);
                });
                resolve(slackMsg);
                // Pass error message on to bot.
            }).catch((err) => {
                reject(msg.errorMessage(err));
            });
        });
    },

// Get the state of all AMI images owned by user.
// Finds all images used by the users instances and gets status of those instances.
    getAMIStatus: function () {
        return new Promise(function (resolve, reject) {

            var slackMsg = new SlackTemplate();
            var imageList = [];

            module.exports.instList().then((instancesList) => {

                instancesList.forEach(function (inst) {
                    var name = inst.ImageId;
                    if (imageList.indexOf(name) <= -1)
                        imageList.push(name);
                });

                if (imageList.length <= 0) {
                    var errMsg = "No AMIs found.";
                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addText(errMsg);
                    resolve(slackMsg);
                } else {
                    var paramsImg = {
                        DryRun: false,
                        ImageIds: imageList
                    };

                    ec2Data.describeImages(paramsImg, function (err, data) {
                        if (err) {
                            reject(msg.errorMessage(err.message));
                        }
                        else {
                            var images = data.Images;

                            images.forEach(function (image) {
                                var name = image.Name;
                                var state = image.State;
                                var response = "";

                                slackMsg.addAttachment(msg.getAttachNum());

                                response += name + " is " + state + ".";

                                if (state === AMI_AVBL) {
                                    slackMsg.addColor(msg.SLACK_GREEN);
                                }
                                // Include reason if not available.
                                else {
                                    var code = image.StateReason.Code;
                                    var reason = image.StateReason.Message;
                                    var color = (state === AMI_PEND) ? msg.SLACK_YELLOW : msg.SLACK_RED;
                                    response += "\n" +
                                        "Reason: " +
                                        reason +
                                        "(Code: " + code + ")";
                                    slackMsg.addColor(color);
                                }
                                response += "\n\n";
                                slackMsg.addText(response);
                            });
                            resolve(slackMsg);
                        }
                    });
                }
            // Pass error message on to bot.
            }).catch((err) => {
                reject(msg.errorMessage(err));
            });
        });
    },

    // Get available hardware information about each instance.
    getHardwareInfo: function(){
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();
            var colorCounter = 0;

            module.exports.instList().then((instancesList) => {
                instancesList.forEach(function (inst) {

                    var text = "";
                    var name = module.exports.getEC2Name(inst);
                    var instanceId = inst.InstanceId;
                    var imageId = inst.ImageId;
                    var instanceType = inst.InstanceType;
                    var zone = inst.Placement.AvailabilityZone;
                    var monitor = msg.capitalizeFirstLetter(inst.Monitoring.State);
                    var windows = inst.Platform === 'Windows' ? 'Yes' : 'No';
                    var arch = inst.Architecture;
                    var root = inst.RootDeviceName;
                    var rootType = inst.RootDeviceType;
                    var virt = inst.VirtualizationType;
                    var hyper = inst.Hypervisor;
                    var kernel = inst.KernelId ? inst.KernelId : "Not Available";
                    var ramdisk = inst.RamdiskId ? inst.RamdiskId : "Not Available";
                    var ebsOpt = inst.EbsOptimized ? "Enabled" : "Disabled";
                    var ena = inst.EnaSupport ? "Enabled" : "Disabled";

                    text +=
                        'Instance ID: ' + instanceId + '\n' +
                        'AMI ID: ' + imageId + '\n' +
                        'Instance Type: ' + instanceType + '\n' +
                        'Region: ' + zone + '\n' +
                        'Detailed Monitoring: ' + monitor + '\n' +
                        'Windows Platform: ' + windows + '\n' +
                        'Architecture: ' + arch +'\n' +
                        'Root Device Name: ' + root + '\n' +
                        'Root Device Type: ' + rootType + '\n' +
                        'Virtualization: ' + virt + '\n' +
                        'Hypervisor: ' + hyper + '\n' +
                        'Kernel ID: ' + kernel + '\n' +
                        'RAMdisk ID: ' + ramdisk + '\n' +
                        'EBS Optimization: ' + ebsOpt + '\n' +
                        'ENA Support: ' + ena + '\n';

                    // Give every other instance a different color
                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addTitle(name);
                    slackMsg.addColor(colorCounter % 2 == 0 ? msg.SLACK_LOGO_BLUE : msg.SLACK_LOGO_PURPLE);
                    slackMsg.addText(text);
                    colorCounter++;
                });
                resolve(slackMsg);
            }).catch((err) => {
                reject(msg.errorMessage(err));
            });

        });
    },

    // Get list of instances with all of instance information
    instList: function() {
        return new Promise(function (resolve, reject) {

            var instanceList = [];

            var params = {
                DryRun: false
            };

            ec2Data.describeInstances(params, function (err, data) {
                if (err) {
                    reject(msg.errorMessage(err.message));
                } else {
                    var res = data.Reservations;

                    res.forEach(function (reservation) {
                        var instances = reservation.Instances;
                        instances.forEach(function (inst) {
                            instanceList.push(inst);
                        });
                    });

                    // Sort instances alphabetically
                    instanceList.sort(function(a, b){
                        var nameA = module.exports.getEC2Name(a).toUpperCase();
                        var nameB = module.exports.getEC2Name(b).toUpperCase();
                        var val = 0;
                        if(nameA < nameB) val = -1;
                        if(nameA > nameB) val = 1;
                        return val;
                    });

                    resolve(instanceList);
                }

            });

        });
    },

    // Get the name of an EC2 instance
    getEC2Name: function (instance) {
        var tags = instance.Tags;
        var name = "Unknown";
        tags.forEach(function (tag) {
            if (tag.Key === "Name") {
                name = tag.Value;
            }
        });

        return name;
    }
};


