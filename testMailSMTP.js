var nodemailer = require('nodemailer');


var transporter = nodemailer.createTransport({
    service: 'smtp.yandex.ru',
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
        user: 'admin@we.guru',
        pass: 'adminweguru1234'
    },
    tls: {
        // do not fail on invalid certs
        ciphers:'SSLv3',
        rejectUnauthorized: false
    }
});
var mailOptions = {
    from: 'admin@we.guru',
    to: 'Antontsyk@gmail.com',
    subject: 'Account Verification Token',
    text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/'
};
transporter.sendMail(mailOptions, function (err) {

    if (err) { console.log({ msg: err.message }); }
});
