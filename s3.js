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
    //list avaiable buckets
    getBuckets : function (){
        
        
        return new Promise(function (resolve, reject) {
            
            var slackMsg = new SlackTemplate();
            
            /*
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
            
//            var results; //holder; to return via resolve
            
            if (1){
                /*
                var params_headBucket = {
                    Bucket: 'STRING_VALUE' //REQUIRED
                };
                */
                var info = []; //collect data.Buckets .Name?
                s3Data.listBuckets({}, function callback (err, data){
                    if(err){
                        console.log(err, err.stack);
                        reject("rejected!"/*msg.errorMessage(err.message)*/);
                    }
                    else {//code
                        var buckets = data.Buckets //.Buckets, array<map>, name-creationDate; .Owner, map, DisplayName-ID
                        
                        buckets.forEach(function (bucket) {
                            var name = bucket.Name;
                            info.push(name);
                        });
                        
                        resolve(info);
                    }
                });
                /*
                var bucketHead = s3Data.headBucket(params_headBucket, function callback (err, data){
                        if(err){
                            console.log(err, err.stack);
                            reject(msg.errorMessage(err.message));
                        }
                        //code
                    //info.push(data);
                });
                */
                
                //+ "info0:: " + info[0]
                //+ "info1:: " + info[1]

                
                
                
                /*
                //slack message formatting
                slackMsg.addAttachment(msg.getAttachNum());
                var text = '';
                text = "\n\nlist all buckets owned by the authenticated sender of the request:: "
                    + " \nJSON.stringify:: "
                    + JSON.stringify(bucketList)
                    + " \ntoString():: "
                    + bucketList.toString();
                    + " \ndry:: "
                    + bucketList
                    + " \ncheck if bucket exists and you have permission to access it:: " 
                    //+ bucketHead
                ;
                slackMsg.addText(text);
                resolve(slackMsg);*/
            }
            else{
                reject("rejected!"/*msg.errorMessage("something went wrong! in s3.js")*/);
            }
            
            
            /*method().then(()=>{
                resolve({});
            }).catch((err)=>{
                reject(msg.errorMessage(err));
            });*/
            
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







