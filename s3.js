/*
    AWS S3
    API: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
 */

//Library
var botBuilder = require('claudia-bot-builder');
const SlackTemplate = botBuilder.slackTemplate;
const msg = require('./message.js');

// AWS S3
const aws = require('aws-sdk');
const s3Data = new aws.S3({region: 'us-west-2', maxRetries: 15, apiVersion: '2006-03-01'});

module.exports = {
    
    
    
    //Get bucket info for other functions to use (bucketNames)
    bucketNamesList: function(){
        return new Promise(function (resolve, reject) {    

            var bucketNamesList = [];
            s3Data.listBuckets({}, function callback (err, data){
                if(err){
                    //console.log(err, err.stack);
                    reject(msg.errorMessage(err.message));
                }
                else {//code
                    //.Buckets returns array<map> with name & creationDate; .Owner returns map with DisplayName & ID
                    var buckets = data.Buckets;
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

                }
            });
            resolve(slackMsg);
        })
    }/*,
    
    
        
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


