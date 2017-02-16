var botBuilder = require('claudia-bot-builder'),
    excuse = require('huh');

module.exports = botBuilder(function (request) {
    console.log("console log test.");
    console.log("full request, " + JSON.stringify(request.originalRequest));
    return ' Thanks for sending ' + request.text +
        '. Your message is very important to us, but ' +
        excuse.get();
}, { platforms: ['slackSlashCommand'] });

//Just says 'OK' in browser. Must obtain tokens by creating a slack slash command, then slack app and connecting the two in slack app settings. 
//I only get an empty object {} with slack-slash config; Worked fine with bot-builder and slack-app config. note: verification token was slash command token and not slack app token!



/* For Later
add 2nd arg
, { platforms: ['slackSlashCommand', 'alexa', 'slackSlashApp'] }    //slash app might not be real
POSSIBLE SCRIPT
claudia create --region us-west-2 --name staticName --config seperateStaticConfig.json --role staticRolePerhapsShared --description infoNotFromPackageJson --api-module botFile
//should create some more
maybe one to change mainBot.js

*/