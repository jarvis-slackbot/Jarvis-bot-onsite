var AWS = require('aws-sdk'); 

/*
//2 attribs AWS.Config must be set are region & credentials 
var myCredentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId:'IDENTITY_POOL_ID'
});
var myConfig = new AWS.Config({
  credentials: myCredentials, region: 'us-west-2'
});
/**/
//set after creating AWS.config
myConfig = new AWS.Config();
myConfig.update({region: 'us-west-2'});

//console.log("config: " + myConfig);

