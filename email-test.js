// then send emails to these users
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

var transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
})

var mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: 'phillipai@hotmail.com',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
}

transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});
