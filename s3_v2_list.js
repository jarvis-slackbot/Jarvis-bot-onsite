/*
    AWS EC2
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
    //list avaiable buckets
    getBuckets : function (){
        
        module.exports.bucketNamesList().then((bucketNames) => {
            //slack message formatting
            slackMsg.addAttachment(msg.getAttachNum());
            var text = '';

            if (bucketNames.length > 0){
                bucketNames.forEach(function(name){
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

        })/*.catch((err)=>{
                reject(msg.errorMessage(err));
        })*/;
    }/*
    
    
    
    
    
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



