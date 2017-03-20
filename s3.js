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
let stringSimilarity = require('string-similarity');

// AWS S3
const aws = require('aws-sdk');
const s3Data = new aws.S3({region: 'us-west-2', maxRetries: 15, apiVersion: '2006-03-01'});

const SIZE_TYPE = {
    B: 'B',
    KB: 'KB',
    MB: 'MB',
    GB: 'GB'
};

// Value associated with string-similarity when doing object list search
// Value 0 - 1, Higher value means it require more similarity
const SIMILARITY_VALUE = 0.8;

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
            bucketListWithTags().then(bucketList => {

                // Argument processing here
                if(argHelper.hasArgs(args)){
                    bucketList = argHelper.filterInstListByTagValues(bucketList, args);
                }

                if(listEmpty(bucketList)){
                    reject(msg.errorMessage("No buckets found."));
                }

                bucketList.forEach(bucket => {

                    let bucketName = bucket.name;

                    s3Data.getBucketPolicy({Bucket: bucketName}, (err, data) => {
                        let text = '';
                        if(err){
                            text = err.message;
                            attachments.push(msg.createAttachmentData(bucketName, null, text, msg.SLACK_RED));
                        }
                        else {
                            // Raw json
                            if(argHelper.hasArgs(args) && args.raw) {
                                // Make json pretty
                                text = JSON.stringify(JSON.parse(data.Policy), null, 2);
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
                                    attachments.push(msg.createAttachmentData(bucketName, null, text, null));
                                }
                                catch(err){
                                    text = err.toString();
                                    text += '\nTry using --raw.';
                                    attachments.push(msg.createAttachmentData(bucketName, null, text, msg.SLACK_RED));
                                }

                            }
                        }
                        count++;
                        if(count === bucketList.length){
                            let slackMsg = msg.buildAttachments(attachments, true);
                            resolve(slackMsg);
                        }
                    });
                });
            }).catch(err => reject(msg.errorMessage(err)));
        });
    },

    // Generic bucket info - pulls from LOTS of api calls
    getBucketInfo: function(args) {
        return new Promise((resolve, reject) => {
            let attachments = [];
            let count = 0;

            bucketListWithTags().then((bucketList) => {

                // Argument processing here
                if(argHelper.hasArgs(args)){
                    bucketList = argHelper.filterInstListByTagValues(bucketList, args);
                }
                // Either no instances match criteria OR no instances on AWS
                if(listEmpty(bucketList)){
                    reject(msg.errorMessage("No buckets found."));
                }

                bucketList.forEach(bucket => {

                    let bucketName = bucket.name;
                    let text = '';

                    // All the promises with indices
                    let bucketSize = sizeOfBucket(bucketName); // 0
                    let bucketRegion = getBucketRegion(bucketName); // 1
                    let objectNum = numberOfObjects(bucketName); // 2
                    let accel = getAccelConfig(bucketName); // 3
                    let owner = getBucketOwnerInfo(bucketName); // 4
                    let version = getBucketVersioning(bucketName); // 5
                    let logging = getLoggingStatus(bucketName); // 6

                    // All done? Lets do it.
                    Promise.all([
                        bucketSize,
                        bucketRegion,
                        objectNum,
                        accel,
                        owner,
                        version,
                        logging
                    ]).then((dataList)=>{
                        try{
                            let size = getSizeString(dataList[0]);
                            let region = dataList[1];
                            let objectsNumber = dataList[2];
                            let accelConfig = dataList[3];
                            let ownerName = dataList[4];
                            let versionStatus = dataList[5];
                            let logStatus = dataList[6];

                            text +=
                                'Region: ' + region + '\n' +
                                'Owner: ' + ownerName + '\n' +
                                'Size: ' + size + '\n' +
                                'Number of Objects: ' + objectsNumber + '\n' +
                                'Accel Configuration: ' + accelConfig + '\n' +
                                'Versioning: ' + versionStatus + '\n' +
                                'Logging: ' + logStatus + '\n';

                            attachments.push(msg.createAttachmentData(bucketName, null, text, null));
                        }
                        catch(err){
                            text = err.toString();
                            attachments.push(msg.createAttachmentData(bucketName, null, text, msg.SLACK_RED));
                        }

                        count++;
                        if(count === bucketList.length){
                            let slackMsg = msg.buildAttachments(attachments, true);
                            resolve(slackMsg);
                        }
                    }).catch(err => {
                        reject(msg.errorMessage(JSON.stringify(err)));
                    });
                });
            }).catch(err => {
                reject(msg.errorMessage(JSON.stringify(err)));
            });
        })
    },

    // Logging information for buckets
    bucketLoggingInfo: function(args){
        return new Promise((resolve, reject) => {
            let count = 0;
            let attachments = [];

            bucketListWithTags().then(bucketList => {
                // Argument processing here
                if(argHelper.hasArgs(args)){
                    bucketList = argHelper.filterInstListByTagValues(bucketList, args);
                }
                // Either no instances match criteria OR no instances on AWS
                if(listEmpty(bucketList)){
                    reject(msg.errorMessage("No buckets found."));
                }

                bucketList.forEach(bucket => {
                    let bucketName = bucket.name;
                    s3Data.getBucketLogging({Bucket: bucketName}, (err, data) => {
                        if(err) reject(err);
                        let text = '';
                        try{
                            let logging = data.LoggingEnabled;

                            if(!logging){
                                text = 'Logging not enabled.';
                                attachments.push(msg.createAttachmentData(bucketName, null, text,  msg.SLACK_RED));
                            }
                            else{
                                let target = logging.TargetBucket;
                                let prefix = logging.TargetPrefix;
                                text = 'Target Bucket: ' + target + '\n' +
                                       'Target Prefix: ' + prefix + '\n';
                                attachments.push(msg.createAttachmentData(bucketName, null, text, null));
                            }

                        }
                        catch(error){
                            text = error.toString();
                            attachments.push(msg.createAttachmentData(bucketName, null, text,  msg.SLACK_RED));
                        }

                        count++;
                        if(count === bucketList.length){
                            let slackMsg = msg.buildAttachments(attachments, true);
                            resolve(slackMsg);
                        }

                    });
                });
            });
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

//------------------------
// Object list filters

// Objects by tag key or value
// Very taxing, warn user of possible delay
// key param is true/false
function filterObjectsByTag(bucketName, objList, objectKey, key){
    return new Promise((resolve, reject) => {

        let resultObjectList = [];
        let objCount = 0;

        objList.forEach(obj => {
            let name;
            try {
                name = obj.Key; // obj name
            } catch (err) {
                reject(err.toString());
            }
            getObjectTags(bucketName, name).then(objTags => {
                objTags.forEach(tag => {
                    if (tag.Key && tag.Value) {
                        // If user is searching by key
                        if (key && (objectKey === tag.Key)) {
                            resultObjectList.push(obj);
                        }
                        else if (objectKey === tag.Value) {
                            resultObjectList.push(obj);
                        }
                    }
                });
                objCount++;
                if (objCount >= objList.length) {
                    resolve(resultObjectList);
                }
            }).catch(err => {
                reject(JSON.stringify(err));
            });
        });
    });

}

// Sort object list alphabetically
// Per bucket basis
function objByAlpha(objList){
        // Sort instances alphabetically
        objList.sort(function(a, b){
            let nameA = a.Key;
            let nameB = b.Key;
            let val = 0;
            if(nameA < nameB) val = -1;
            if(nameA > nameB) val = 1;
            return val;
        });
}

// Sort by file size, largest to smallest
function sortByFileSize(objList){
    objList.sort(function(a,b) => {
        let aSize = a.Size ? a.Size : 0;
        let bSize = b.Size ? b.Size : 0;
        let val = 0;
        if(aSize < bSize) val = 1;
        if(aSize > bSize) val = -1;
        return val;
    });
}

// Sort object list by last date modified
function sortByDate(objList){
    objList.sort((a, b) => {
        let dateA = a.LastModified ? a.LastModified.getTime() : Date.now().getTime();
        let dateB = b.LastModified ? b.LastModified.getTime() : Date.now().getTime();
        let val = 0;
        if(dateA < dateB) val = -1;
        if(dateA > dateB) val = 1;
        return val;
    });
}

function filterObjectsByOwner(objList, ownerName){
    let resultList = [];

    objList.forEach((obj) => {
        if(obj.Owner && obj.Owner.DisplayName){
            let name = obj.Owner.DisplayName;
            if(name === ownerName){
                resultList.push(obj);
            }
        }
    });

    return resultList;
}

function filterBySimilarName(objList, keyword){
    let resultsList = [];
    keyword = keyword.join(' ');
    objList.forEach((obj) => {
        let objName = obj.Key ? obj.Key : "";
        let similarity = stringSimilarity.compareTwoStrings(keyword, objName);
        if(similarity >= SIMILARITY_VALUE){
            resultsList.push(obj);
        }
    });

    return resultsList;
}

//------------------------

function getObjectTags(bucketName, objectKey) {
    return new Promise((resolve, reject) => {
        s3Data.getObjectTagging({
            Bucket: bucketName,
            Key: objectKey
        }, (err, data) => {
            if(err) reject(JSON.stringify(err));
            try{
                resolve(data.TagSet)
            } catch(err) {
                resolve([]);
            }
        });
    });
}

// Get the bucket list including tags for the bucket
function bucketListWithTags() {
    return new Promise((resolve, reject) => {
        module.exports.bucketNamesList().then(bucketList => {
            let count = 0;
            let resultBucketList = [];
            bucketList.forEach(bucketName => {
                s3Data.getBucketTagging({Bucket: bucketName}, (err, data) => {
                    if(err) {
                        resultBucketList.push({
                            name: bucketName,
                            Tags: [] // Key must be Tags to match ec2
                        });
                    }
                    else {

                        resultBucketList.push({
                            name: bucketName,
                            Tags: data.TagSet ? data.TagSet : [] // Key must be Tags to match ec2
                        });
                    }

                    count++;
                    if(count === bucketList.length){
                        resolve(resultBucketList);
                    }
                });
            });
        }).catch(err => {
            reject(msg.errorMessage(JSON.stringify(err)));
        });
    })
}

// Get logging status
function getLoggingStatus(bucketName){
    return new Promise((resolve, reject) => {
        s3Data.getBucketLogging({Bucket: bucketName}, (err, data) => {
            if(err) reject(err);
            resolve(data.LoggingEnabled ? 'Enabled' : 'Disabled');
        });
    });
}

// Get versioning status of the bucket
function getBucketVersioning(bucketName) {
    return new Promise((resolve, reject) => {
        s3Data.getBucketVersioning({Bucket: bucketName}, (err, data) => {
            if(err) reject(err);
            let status;
            try{
                status = data.Status ? data.Status : "Disabled";
            }
            catch(err){
                status = 'Unknown, ' + err.toString();
            }
            resolve(status);
        });
    });
}

// Get bucket owner name
function getBucketOwnerInfo(bucketName) {
    return new Promise((resolve, reject) => {
        s3Data.getBucketAcl({Bucket: bucketName}, (err, data) => {
            if(err) reject(err);
            let info;
            try{
                info = data.Owner.DisplayName;
            }
            catch(err){
                info = "Unknown: " + err.toString();
            }
            resolve(info);
        });
    });
}

// Get accelration configuration status
function getAccelConfig(bucketName) {
    return new Promise((resolve, reject) => {
        s3Data.getBucketAccelerateConfiguration({Bucket: bucketName}, (err, data) => {
            if(err) reject(err);
            let status = '';
            try{
                status = data.Status ? data.Status : "Disabled";
            }
            catch(err){
                status = "Unknown. " + err.toString();
            }
            resolve(status);
        });
    });
}

// Get bucket location
function getBucketRegion(bucketName){
    return new Promise((resolve, reject)=> {
        s3Data.getBucketLocation({Bucket: bucketName}, (err, data) => {
            if(err) reject(err);
            resolve(data.LocationConstraint);
        });
    });
}


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

// Get number of objects in a bucket
function numberOfObjects(bucketName){
    return new Promise((resolve, reject) => {
        objectsList(bucketName).then(objects => {
            resolve(objects.length);
        }).catch(err => {reject(err)});
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

// Get string for size value
function getSizeString(bytes){
    let type = getSizeLabel(bytes);
    let num = convertSize(bytes, type);
    return num + ' ' + type;
}

// Get the appropriate size label for the number of bytes
function getSizeLabel(bytes){
    let type = '';
    if(bytes < 1000){
        type = SIZE_TYPE.B;
    }
    else if(bytes < 1000000){
        type = SIZE_TYPE.KB;
    }
    else if(bytes < 1000000000){
        type = SIZE_TYPE.MB;
    }
    else{
        type = SIZE_TYPE.GB;
    }

    return type;
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



