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
const s3Data = new aws.S3({region: 'us-west-2', maxRetries: 15, apiVersion: '2016-11-15'});

module.exports = {
    /*model
    { buckets: 
        {name:b1, region: r1}, 
        {name:b2, region: r2}
    }
    */
//    model : {}, 
    //list avaiable buckets
    getBuckets : function (){
        
        return new Promise(function (resolve, reject) {    

            var slackMsg = new SlackTemplate();
            
            var info = []; //collect data.Buckets.Name
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
                        info.push(name);
                    });


                    //slack message formatting
                    slackMsg.addAttachment(msg.getAttachNum());
                    var text = '';

                    if (info.length > 0){
                        info.forEach(function(name){
                            text += "S3 bucket: " + name + "\n";
                        });
                        slackMsg.addText(text);
                        resolve(slackMsg);
                    }
                    else {
                        text = "There are no S3 buckets.";
                        slackMsg.addText(text);
                        resolve(slackMsg);
                    }
                }
            });




            /*
            //use bucket names from other function then use that to for each below code by changing params_headBucket.Bucket and calling method
            var params_headBucket = {
                Bucket: 'STRING_VALUE' //REQUIRED
            };
            var allHeadBuckets = [];
            s3Data.headBucket(params_headBucket, function callback (err, data){
                if(err){
                    //console.log(err, err.stack);
                    reject(msg.errorMessage(err.message));
                }
                else {//code
                
//                    var extracts = data.SOMETHING;
                    extracts.forEach(function (extract) {
                        var something = extract.something;
                        allHeadBuckets.push(something);
                    });


                    //slack message formatting
                    slackMsg.addAttachment(msg.getAttachNum());
                    var text = '';

                    if (allHeadBuckets.length > 0){
                        allHeadBuckets.forEach(function(extract){
                            text += "headbucket: " + something + "\n";
                        });
                        slackMsg.addText(text);
                        resolve(slackMsg);
                    }
                    else {
                        text = "There are no headbuckets.";
                        slackMsg.addText(text);
                        resolve(slackMsg);
                    }
                }
            });
            */

            
        }).catch((err)=>{
                reject(msg.errorMessage(err));
        });
    },
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



