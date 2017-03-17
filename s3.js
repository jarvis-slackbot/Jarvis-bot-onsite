/*
    AWS S3
    API: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
 */

'use strict';

//Library
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const msg = require('./message.js');
const argHelper = require('./arguments.js');

// AWS S3
const aws = require('aws-sdk');
const s3Data = new aws.S3({region: 'us-west-2', maxRetries: 15, apiVersion: '2006-03-01'});

const SIZE_TYPE = {
    KB: 'kilobyte',
    MB: 'megabyte',
    GB: 'gigabyte'
};

module.exports = {
    
    
    
    //Get bucket info for other functions to use (bucketNames)
    bucketNamesList: function(){
        return new Promise(function (resolve, reject) {    

            var bucketNamesList = [];
            s3Data.listBuckets({}, function (err, data){
                if(err){
                    //console.log(err, err.stack);
                    reject(msg.errorMessage(err.message));
                }
                else {//code
                    //.Buckets returns array<map> with name & creationDate; .Owner returns map with DisplayName & ID
                    var buckets = data.Buckets ? data.Buckets : [];
                    buckets.forEach(function (bucket) {
                        var name = bucket.Name;
                        bucketNamesList.push(name);
                    });
                    resolve(bucketNamesList);
                }
            });
        });
    },
    
    
    
    getS3Tags: function() {
        return new Promise(function (resolve, reject) {
            var slackMsg = new SlackTemplate();

            var date = new Date(Date.now());
            var date2 = new Date(Date.now() - ((5 * 60) * 1000));

            var param = {
                Bucket: 'jarvisbucket1'
            };
            s3Data.getBucketTagging(param, function (err, data) {
                if (err) {
                    reject(msg.errorMessage(JSON.stringify(err)));
                }
                else {
                    var text = '';
                    text += text + data.TagSet[0].Key;
                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addText(text);

                }
            });
            resolve(slackMsg);
        })
    },

    
    
    getS3BucketObject: function(){
        return new Promise(function (resolve, reject) {

            var slackMsg = new SlackTemplate();


            var params = {
                Bucket: 'jarvisbucket1',
                Delimiter: 'key',
                EncodingType: 'url',
                Marker: '',
                MaxKeys: 1000,
                Prefix: '',
                RequestPayer: ''
            };

            // TODO - Consider using objectsList function below (V2 api)
            s3Data.listObjects(params, function(err, data) {
                if (err) {
                    reject(msg.errorMessage(JSON.stringify(err)));
                }
                else {
                    var text = 'Objects in this bucket:\n';

                    for(var i = 0; i < data.Contents.length; i++){
                        text = text + data.Contents[i].Key + '\n';
                    }
                    slackMsg.addAttachment(msg.getAttachNum());
                    slackMsg.addText(text);
                    resolve(slackMsg);
                }
            });
        })
    },

    getBucketPolicy: function(args){
        return new Promise(function (resolve, reject) {

            let attachments = [];
            let count = 0;
            let color = '';
            let colorCount = 0; // Instead of count so colors are consistent between calls
            module.exports.bucketNamesList().then(bucketList => {

                if(listEmpty(bucketList)){
                    reject(msg.errorMessage("No buckets found."));
                }

                bucketList.forEach(bucketName => {

                    s3Data.getBucketPolicy({Bucket: bucketName}, (err, data) => {
                        let text = '';
                        if(err){
                            text = err.message;
                            color = msg.SLACK_RED;
                        }
                        else {
                            // Raw json
                            if(argHelper.hasArgs(args) && args.raw) {
                                // Make json pretty
                                text = JSON.stringify(JSON.parse(data.Policy), null, 2);
                                color = colorCount % 2 == 0 ? msg.SLACK_LOGO_BLUE : msg.SLACK_LOGO_PURPLE;
                                colorCount++;
                            }
                            else{
                                // Print values of json
                                try {
                                    let policy = JSON.parse(data.Policy);
                                    let statement = policy.Statement[0];
                                    text += "Version: " + policy.Version + '\n' +
                                        "Policy ID: " + policy.Id + '\n' +
                                        "SID: " + statement.Sid + '\n' +
                                        "Effect: " + statement.Effect + '\n' +
                                        "Principals: \n";
                                    let principals = statement.Principal.AWS;

                                    // Are there multiple pricipals??
                                    if(Object.prototype.toString.call(principals) === '[object Array]') {
                                        principals.forEach(principal => {
                                            text += '\t\t' + principal;
                                        });
                                    }
                                    else {
                                        text += '\t\t' + principals + "\n";
                                    }

                                    text += "Action: " + statement.Action + "\n" +
                                        "Resource: " + statement.Resource;
                                    color = colorCount % 2 == 0 ? msg.SLACK_LOGO_BLUE : msg.SLACK_LOGO_PURPLE;
                                    colorCount++;
                                }
                                catch(err){
                                    text = err.toString();
                                    color = msg.SLACK_RED;
                                    text += '\nTry using --raw.';
                                }

                            }
                        }
                        attachments.push(msg.createAttachmentData(bucketName, '', text, color));
                        count++;
                        if(count === bucketList.length){
                            let slackMsg = msg.buildAttachments(attachments);
                            resolve(slackMsg);
                        }
                    });
                });
            }).catch(err => reject(msg.errorMessage(err)));
        });
    }


    /*
    
    
        
    //access control policy (aka acl) of buckets.
    getAcl : function (){
        
        return new Promise(function (resolve, reject) {    

            var slackMsg = new SlackTemplate();
            
            var info = []; //collects data; (object-acl for buckets)
            //params to be changed for multiple buckets through a seperate function
            s3Data.getBucketAcl({Bucket: 'jarvisbucket1'}, function callback (err, data){
                if(err){
                    //console.log(err, err.stack);
                    reject(msg.errorMessage(err.message));
                }
                else {//code
                    info.push(data);
                    

                    //slack message formatting
                    slackMsg.addAttachment(msg.getAttachNum());
                    var text = '';

                    if (info.length > 0){
                        info.forEach(function(acl){
                            text += "ACL for bucket: " + JSON.stringify(acl) + "\n";
                        });
                        slackMsg.addText(text);
                        resolve(slackMsg);
                    }
                    else {
                        text = "There are no acl for present S3 buckets.";
                        slackMsg.addText(text);
                        resolve(slackMsg);
                    }
                }
            });

        }).catch((err)=>{
                reject(msg.errorMessage(err));
        });
    }/*,
    
    getBucketNames : function (){
        
        return new Promise(function (resolve, reject){
            
        });
    },
    getBucketRegions : function (){
        
        return new Promise(function (resolve, reject){
            
        });
    },*/
    /*considerations
    sort, repeats, un/used, in/active    
    */
    
};


//Get total size of bucket by name - in bytes
function sizeOfBucket(bucketname){
    return new Promise((resolve, reject)=> {
        objectsList(bucketname).then((objects)=>{
            let sum = 0;
            objects.forEach((obj)=>{
                if(obj.Size){
                    sum += obj.Size;
                }
            });
            resolve(sum);
        });
    });
}

// List objects per bucket name
function objectsList(bucketName){
    return new Promise((resolve, reject)=>{
        let params = {
            Bucket: bucketName
        };
        s3Data.listObjectsV2(params, (err, data) => {
            if(err){
                reject(err);
            }
            else{
                resolve(data.Contents);
            }
        });
    })
}


function convertSize(bytes, type){
    let res = 0;
    switch(type){
        case SIZE_TYPE.KB:
            res = bytes / 1000;
            break;
        case SIZE_TYPE.MB:
            res = bytes / 1000000;
            break;
        case SIZE_TYPE.GB:
            res = bytes / 1000000000;
            break;
        default:
            res = bytes;
    }

    res = round(res);
    return res;
}

function round(num){
    return +num.toFixed(1);
}

// Return true for empty list
function listEmpty(list){
    return !(typeof list !== 'undefined' && list.length > 0);
}






















/* SCRATCH CODE

--DELETE-- Temp list. possible methods.
(AWS.Request) getBucketAcl(params = {}, callback)
    Gets the access control policy for the bucket.
(AWS.Request) getBucketLocation(params = {}, callback)
    Returns the region the bucket resides in.
(AWS.Request) headBucket(params = {}, callback)
    This operation is useful to determine if a bucket exists and you have permission to access it.
(AWS.Request) headObject(params = {}, callback)
    The HEAD operation retrieves metadata from an object without returning the object itself.
(AWS.Request) listBuckets(params = {}, callback)
    Returns a list of all buckets owned by the authenticated sender of the request.



*/



