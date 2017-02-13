/*Slack Authorization
ToDo: make this asynchronous by promises returns.
*/
require('./setEnvironments.js');
const Request = require('request'); 
const Apibuilder = require('claudia-api-builder');
const Qs = require('querystring');
        //const Slacktemplate = require('claudia-bot-builder').slackTemplate;

//lambda function
const LAMBDA_URL = "https://s9jvrvpau5.execute-api.us-west-2.amazonaws.com/latest";
//slack app info
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const TEST_TOKEN = process.env.SLACK_TEST_TOKEN;       
const TOKEN = ""; //to be obtained via oauth.access

//the two steps of oauth
const SLACK_OAUTH_AUTHORIZE = "https://slack.com/oauth/authorize";
const SLACK_API_OAUTH_ACCESS = "https://slack.com/api/oauth.access";
//authorize?client_id=_&scope=_&redirect_uri=_&
//oauth.access?client_id=_&client_secret=_&code=_&redirect_uri=_&
//query info
const SCOPE = "commands,bot";
const REDIRECT_URI= LAMBDA_URL + "/auth";

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

var bod;
var apiBuilder = new Apibuilder();
apiBuilder.get('/hello', function (request) {
	return "Name is: " + request.queryString.name;
});//hello get;
apiBuilder.post('/hellop', function (request) {
	return "Name is: " + request.queryString.name;
});//hello post;
apiBuilder.post('/auth', function(req){
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
    var team = undefined;/*
    Request.post(SLACK_API_OAUTH_ACCESS, query, function (error, response, body) { //---
        if (!error) { //&& response.statusCode == 200
            TOKEN = JSON.parse(body).access_token; //Auth token
        }
        query = {form: {
            token: TOKEN
        }}; //---

        decoy = Request.post('https://slack.com/api/team.info', {form: {token: ""}}, function (error, response, body) {//---
            if (!error ) { //&& response.statusCode == 200
                bod = JSON.parse(body);
                team = JSON.parse(body).team.domain; 
                //response.redirect('http://' +team+ '.slack.com'); //if not work, use return to http or use get method 
            }//---
            bod = JSON.parse(body);
            team = JSON.parse(response);
            var decoy = "LOL!";
            return decoy;
        }); //team.info
    }); //oauth.access
    */ //---
        apiBuilder.post('https://slack.com/api/team.info?code=123456', function (req){
            bod = req.queryString.code;
            
        });/**/
    
    //var teamSite = 'http://' + team + '.slack.com';
    return "TestReturn:: \nQuery: " + JSON.stringify(query) + " \n" + "body:: " + bod + " response::" + team + " decoy: " + JSON.stringify(decoy) + " queryString: " + JSON.stringify(queryString);
    
    
    
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
