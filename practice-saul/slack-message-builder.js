const botBuilder = require('claudia-bot-builder');
const slackTemplate = botBuilder.slackTemplate;

module.exports = botBuilder(request => {
    console.log("console log test.");
    console.log("full request, " + JSON.stringify(request.originalRequest));
  if (request.type === 'slack') {
    const message = new slackTemplate('This is sample text');

    return message;/*
      .addAttachment('A1')
        .addAction('Button 1', 'button', '1')
        .addAction('Button with confirm', 'button', '2')
          .addConfirmation('Ok?', 'This is confirm text', 'Ok', 'Cancel')
        .addAction('Button 3', 'button', '3')
      .get();*/
  }
}, { platforms: ['slackSlashCommand'] });

//not working too well. I only get an empty object {}; Worked fine with bot-builder and slack-app config. note: verification token was slash command token and not slack app token!

