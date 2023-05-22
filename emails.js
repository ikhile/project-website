import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

// https://community.nodemailer.com/2-0-0-beta/templating/
var transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
})

export function sendEmail(to, subject, text) {
    const options = { from: `TixFix <${process.env.EMAIL_USERNAME}>`, to, subject, text }

    transporter.sendMail(options, (error, info) => {
        if (error) console.error(error)
        else console.log('Email sent: ' + info.response)
    })
}

// sendEmail("phillipai@hotmail.com", "test", "test")

