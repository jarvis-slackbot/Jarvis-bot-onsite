/*
    AWS EC2
    API: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
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

                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addTitle(name);
                    // Give every other instance a different color
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
    // Get network information of an instance
    getNetworkInfo: function(){
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();
            var colorCounter = 0;

            module.exports.instList().then((instancesList) => {
                instancesList.forEach(function (inst) {
                    var text = "";
                    var name = module.exports.getEC2Name(inst);
                    var instanceId = inst.InstanceId;
                    var netInt = inst.NetworkInterfaces[0]; //Network interface values
                    var status = netInt.Status;
                    var pubIp = inst.PublicIpAddress ? inst.PublicIpAddress : 'Not set';
                    var pubDns = inst.PublicDnsName ? inst.PublicDnsName : 'Not set'  ;
                    var privIp = inst.PrivateIpAddress;
                    var privDns = inst.PrivateDnsName;
                    var netInterId = netInt.NetworkInterfaceId;
                    var macAddr = netInt.MacAddress;
                    var subnetId = netInt.SubnetId;
                    var vpcId = netInt.VpcId;

                    text +=
                        'Instance ID: ' + instanceId + '\n' +
                        'Network Status: ' + status + '\n' +
                        'Public IP: ' + pubIp + '\n' +
                        'Public DNS: ' + pubDns + '\n' +
                        'Private IP: ' + privIp + '\n' +
                        'Private DNS: ' + privDns + '\n' +
                        'Network Interface ID: ' + netInterId + '\n' +
                        'Mac Address: ' + macAddr + '\n' +
                        'Subnet : ' + subnetId + '\n' +
                        'VPC ID: ' + vpcId + '\n';
                    // If there are IPV6 addresses attached to the instance
                    var ipv6 = inst.Ipv6Address;
                    if(ipv6 != null){
                        text += 'Ipv6 Addresses: ';
                        ipv6.forEach(function (addr) {
                            text += addr + ' ';
                        });
                        text += '\n';
                    }

                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addTitle(name);
                    // Give every other instance a different color
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

    // Get attached EBS information
    getEBSInfo: function(){
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();
            var colorCounter = 0;

            module.exports.instList().then((instancesList) => {
                instancesList.forEach(function (inst) {

                    var text = '';
                    var name = module.exports.getEC2Name(inst);
                    var attachedDevs = inst.BlockDeviceMappings;

                    if(attachedDevs != null){
                        attachedDevs.forEach(function(dev){

                            var devName = dev.DeviceName;
                            var ebs = dev.Ebs;
                            if(ebs != null) {
                                var volumeId = ebs.VolumeId;
                                var attached = ebs.Status;
                                var timeAttached = ebs.AttachTime ? ebs.AttachTime : 'Not Available';
                                // If ebs will be deleted when instance terminated
                                var delOnTerm = ebs.DeleteOnTermination ? "Yes" : "No";

                                text +=
                                    'Device Name: ' + devName + '\n' +
                                    'Volume ID: ' + volumeId + '\n' +
                                    'Status: ' + attached + '\n' +
                                    'Time Attached: ' + timeAttached + '\n' +
                                    'Delete On Termination: ' + delOnTerm + '\n';
                            }
                            else{
                                text += 'No EBS volume found for ' + devName + '.\n';
                            }
                            text += '\n\n';
                        });
                    }
                    else{
                        text = "No attached devices found.";
                    }
                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addTitle(name);
                    // Give every other instance a different color
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


