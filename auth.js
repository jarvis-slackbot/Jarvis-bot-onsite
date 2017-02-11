/*Slack Authorization*/
require('./setEnvironments.js');
const APIBUILDER = require('claudia-api-builder');
const QS = require('querystring');
const SLACKTEMPLATE = require('claudia-bot-builder').slackTemplate;

//lambda function
const LAMBDA_URL = "https://s9jvrvpau5.execute-api.us-west-2.amazonaws.com/latest";
//slack app info
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const TOKEN = ""; //to be obtained
//the two steps of oauth
const SLACK_OAUTH_AUTHORIZE = "https://slack.com/oauth/authorize";
const SLACK_API_OAUTH_ACCESS = "https://slack.com/api/oauth.access";
//authorize?client_id=_&scope=_&redirect_uri=_&
//oauth.access?client_id=_&client_secret=_&code=_&redirect_uri=_&
//query info
const SCOPE = "commands,bot";
const REDIRECT_URI= LAMBDA_URL + "/auth";

/*step 1
post following somewhere for people to click.
`<a href="https://slack.com/oauth/authorize?scope=commands,bot&client_id=19211852100.138699518324&redirect_uri=https://s9jvrvpau5.execute-api.us-west-2.amazonaws.com/latest/auth?"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>`

*notice the href (added the redirect_uri for clarity[can be added in slack app redirect_uri settings])
After person submits, will re-dir with 'code' query.
*/

/*step 2
Post to 
*/
var apiBuilder = new APIBUILDER();
apiBuilder.get('/auth', function(req){
    var code = req.queryString.code;
    var state = req.queryString.state;
    var query = {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code
        //redirect_uri: slack-team.slack.com
    };

    query = QS.stringify(query);


    return SLACK_API_OAUTH_ACCESS + "?" + query;
}, {
    success: {code: 302}, 
    error: {code: 500}
}
);









/*
===================scratch
var apigateway = new AWS.APIGateway();

apigateway.createApiKey(params, function (err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});

api_gateway.get('/auth', function(req){
        var code = req.queryString.code;
        var state = req.queryString.state;
        var query = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code
        };
        query = qs.stringify(query);
        return SLACK_AUTH + "?" + query;
    }, {
        success: {code: 302}
    }
);
// UNUSED FOR NOW
api_gateway.get('/auth2', function(req){
    var error = req.queryString.error;
    if(error != undefined){
        //Handle error here
    }
    // Store bot user token
    else{
        var json = JSON.parse(req.body);
        var bot_id = json.bot.bot_user_id;
        var bot_access_token = json.bot.bot_access_token;
        process.env.BOT_TOKEN = bot_access_token;
    }
});

=============================
*/





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

*/