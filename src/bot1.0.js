/*Slack Authorization
*/
require('./setEnvironments.js');
const Apibuilder = require('claudia-api-builder');
const Qs = require('querystring');
const Http = require('http');

const LAMBDA_URL = "https://hk26t3ags3.execute-api.us-west-2.amazonaws.com/dev";

//the two steps of oauth
const SLACK_OAUTH_AUTHORIZE = "https://slack.com/oauth/authorize";
const SLACK_API_OAUTH_ACCESS = "https://slack.com/api/oauth.access";
//authorize?client_id=_&scope=_&redirect_uri=_&
//oauth.access?client_id=_&client_secret=_&code=_&redirect_uri=_&

//query info
const SCOPE = "commands,bot";
const REDIRECT_URI= LAMBDA_URL + "/auth";
//slack app info
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const TEST_TOKEN = process.env.SLACK_TEST_TOKEN;       
const TOKEN = ""; //to be obtained via oauth.access

/*step 1.
post following somewhere for people to click.
`<a href="https://slack.com/oauth/authorize?scope=commands,bot&client_id=19211852100.138699518324&redirect_uri=https://s9jvrvpau5.execute-api.us-west-2.amazonaws.com/latest/auth?"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>`

*notice the href (added the redirect_uri for clarity[can be added in slack app redirect_uri settings])
After person submits, will re-dir with 'code' query.
*/

/*step 2.
Post to api/oauth.access? with client_id, client_secret, code, and redirect_uri to obtain access_token. the redirect back to team page
  step 2b
cannot redirect back to team page until post to api/team.info? with a token (obtained after oauth.access) to get obj.team.name (for teamName.slack.com). 
*/

var apiBuilder = new Apibuilder();
apiBuilder.get('/hello', function (request) {
	return "gName is: " + request.queryString.name;
});//hello get;
apiBuilder.post('/hellop', function (request) {
	return "pName is: " + request.queryString.name;
});//hello post;



var http = require('http');

var yupper = function(){
    /**/
    var options = {
      host: 'www.google.com',
      path: 'index.html'
    };
    
    var result = "--";
    var callback = function (response) {
        console.log(`Got response: ${response.statusCode}`);
        // consume response body
        response.resume();
        response.on('error', (e) => {
            console.log(`Got error: ${e.message}`)
        })



        var str = '';
        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            console.log(str + "SUP!");
            result = str; //Trying to catch for outter scope!
        });
        //console.log(response);
        //return str + "\n\n\n" + result;
        
    }
    http.request(options, callback).end();
    return " RES:: " + result;
}

apiBuilder.get('/request2', function(request){
    
    return yupper();
});



//test apiBuilder request inside and outside a function
apiBuilder.get('/request', function (request) {

    /**/


    /**/
    //Convenience method; same as http.request() except method is GET and auto Calls req.end().
    http.get('http://www.google.com/index.html', (res) => {
      console.log(`Got response: ${res.statusCode}`);
      // consume response body
      res.resume();
    }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
    });
    /**/
    return "dam";


    
    
    
    //'https://hk26t3ags3.execute-api.us-west-2.amazonaws.com/dev/hello'

});
console.log("PASSING BY. \n");


apiBuilder.get('/auth', function(req){
    var queryString = req.queryString; //ex: {code: 12}
    var code = req.queryString.code; //ex: 12
    var state = req.queryString.state;
    var query = {form: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code
        //redirect_uri: slack-team.slack.com
        //state: state
    }};/**/
    //query = Qs.stringify(query); //delete
    var decoy = "CHUM";
    var team = undefined;
    //SLACK_API_OAUTH_ACCESS, query; get token JSON.parse(body).access_token
    //https://slack.com/api/team.info'; token: token; team = JSON.parse(body).team.domain; -->http://' +team+ '.slack.com 
/*
apiBuilder.get('https://slack.com/api/team.info?code=123456', function (req){
            bod = req.queryString.code;
            
        });/**/
    
    //var teamSite = 'http://' + team + '.slack.com';
    return "TestReturn:: " + " Body:: " + bod + " Response::" + team + " Decoy: " + JSON.stringify(decoy);
    
    
    
//    return ;
    
}, 
    {
        success: {code: 200}, 
        error: {code: 500}
    }
);







/* Slack METHS TO USE
https://slack.com/api/team.info?token
    obj.team.name or obj.team.domain
https://slack.com/api/oauth.access?client_id=_&client_secret=_&code=_&redirect_uri
    access_token

*/


module.exports = apiBuilder;


    
    
    
    
    
    
    
    
    
/*
OAuth Steps:
1. Add to Slack Button (authorization request)
    https://slack.com/oauth/authorize?scope=commands,bot&client_id=81979454913.97303513202&redirect_uri=LAMBDA_URL/auth?
    Will redirect to LAMBDA_URL/auth? with 'code' variable
        Cortana Lambda: https://s9jvrvpau5.execute-api.us-west-2.amazonaws.com/latest/auth
2. Obtain Access Token
Write api code for LAMBDA_URL/auth?
    Handle req.query.code and POST to /api/oauth.access
        if possible, redirect to team's slack page.
    https://slack.com/api/oauth.access?client_id=81979454913.97303513202&client_secret=(SECRET_INFO)&code=(provided after 'oauth/authorize'; req.query.code)&redirect_uri (option)

Output from /api/oauth.access?:
    {
    "access_token": "(given)",
    "scope": "something"
    }
    Use token, if possible, to obtain team's info to re-direct back to team page.

a. Using API
    oauth never expire. Use auth.revoke
    now can use /api/method?token=(given)

Slack METHS TO USE
https://slack.com/api/team.info?token
    obj.team.name
https://slack.com/api/oauth.access?client_id=_&client_secret=_&code=_&redirect_uri
    access_token
*/
    
    
/*
request supported by lambda's node (4.3.0) runtime:
    https://nodejs.org/docs/v4.3.0/api/http.html#http_http_request_options_callback
*/    
