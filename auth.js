//Slack Authorization
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

require('./setEnvironments.js');
var api = require('claudia-api-builder');
//const = SCOPES = "";
console.log(process.env.SLACK_CLIENT_ID);



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
*/