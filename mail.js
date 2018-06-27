var nodemailer = require('nodemailer');

var sendMailTransport = require('nodemailer-sendmail-transport');
var transport = nodemailer.createTransport(
    sendMailTransport({})
);

var params = {
  from: 'antontsyk@gmail.com', 
  to: 'antontsyk@gmail.com', 
  subject: 'Hi, body!',
  text: 'Let\'s read some articles on Web Creation'
};
transport.sendMail(params, function (err, res) {
  if (err) {
     console.error(err);
  }
});