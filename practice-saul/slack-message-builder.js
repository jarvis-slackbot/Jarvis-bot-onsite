const botBuilder = require('claudia-bot-builder');
const slackTemplate = botBuilder.slackTemplate;

module.exports = botBuilder(request => {
  if (request.type === 'slack') {
    const message = new slackTemplate('This is sample text');

    return message
      .addAttachment('A1')
        .addAction('Button 1', 'button', '1')
        .addAction('Button with confirm', 'button', '2')
          .addConfirmation('Ok?', 'This is confirm text', 'Ok', 'Cancel')
        .addAction('Button 3', 'button', '3')
      .get();
  }
}, { platforms: ['slackSlashCommand'] });