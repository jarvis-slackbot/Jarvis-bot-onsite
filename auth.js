/*
    Slack Authorization
 */

const SLACK_AUTH = "https://slack.com/api_gateway/oauth.access";
const CLIENT_ID = "81979454913.97303513202";
const CLIENT_SECRET = "ab85e84c73978ce51d8e28103de895d9";
const SCOPES = "bot";  // Space separated
const TOKEN = "5aPJyd1E0IrszzWpRCBl0LnS";

/* Needed after demo, make into different lambda function??
// Authorization
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