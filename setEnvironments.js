//Developed to set environment variables at runtime for security reasons
var fs = require('fs');
var AWS = require('aws-sdk');
var pathToFile = "./.env"; //env.json
var bufferObj = fs.readFileSync(pathToFile);
var string = bufferObj.toString();
var json = JSON.parse(string);

//console.log(json.SLACK);
//console.log(json.AWS);

/**/
//SETTING ENVIRONMENT VARIABLES
    //SLACK
    process.env.AWS_PROFILE = json.SLACK.AWS_PROFILE;
    process.env.SLACK_CLIENT_ID = json.SLACK.SLACK_CLIENT_ID;
    process.env.SLACK_CLIENT_SECRET = json.SLACK.SLACK_CLIENT_SECRET;
    process.env.SLACK_VERIFICATION_TOKEN = json.SLACK.SLACK_VERIFICATION_TOKEN;
    process.env.SLACK_TEST_TOKEN = json.SLACK.SLACK_TEST_TOKEN;
    //AWS
    process.env.AWS_ACCESS_KEY_ID = json.AWS.AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = json.AWS.AWS_SECRET_ACCESS_KEY;
    process.env.AWS_REGION = json.AWS.AWS_REGION;






/*
//EXAMPLES (replace ex's with links if possible)
//setting configuration via AWS methods
AWS.config.update({
    region: 'us-west-2', 
    credentials: {YOUR_CREDENTIALS}
});
AWS.config.loadFromPath('./config.json');
AWS.config.credentials = new AWS.SharedIniFileCredentials({
    profile: 'my_profile_name' 
});
//locking API version + creating and calling srevice obj's
AWS.config.apiVersions = {
    dynamodb: '2011-12-05',
    ec2: '2013-02-01',
    redshift: 'latest'
};
var s3 = new S3({
    apiVersion: '2006-03-01',
    region: 'us-west-1', 
    credentials: {YOUR_CREDENTIALS}
  });
s3.getObject({
    Bucket: 'bucketName', 
    Key: 'keyName'
});
var s3bucket = new AWS.S3({
    params: {Bucket: 'myBucket'}, 
    apiVersion: '2006-03-01' 
});
//.aws/credentials [profile] var=val
/**/

