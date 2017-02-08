var botBuilder = require('claudia-bot-builder'),
    excuse = require('huh');

module.exports = botBuilder(function (request) {
    console.log("console log test.");
    console.log("full request, " + JSON.stringify(request.originalRequest))
    return ' Thanks for sending ' + request.text +
        '. Your message is very important to us, but ' +
        excuse.get();
});
//Couldn't see if this worked well, needed an access token or configure with something(from possible configurations) to obtain one.
//In video, person sent a message/request and replied back with same info, like above.



/* For Later
add 2nd arg
, { platforms: ['slackSlashCommand', 'alexa', 'slackSlashApp'] }    //slash app might not be real
POSSIBLE SCRIPT
claudia create --region us-west-2 --name staticName --config seperateStaticConfig.json --role staticRolePerhapsShared --description infoNotFromPackageJson --api-module botFile



*/