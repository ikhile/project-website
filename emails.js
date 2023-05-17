// https://community.nodemailer.com/2-0-0-beta/templating/
var transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
})

function sendEmail(options) {
    transporter.sendMail(options, function(error, info){
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })
}

console.log(dateInfo)

var mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: ['phillipai@hotmail.com', ...emailList],
    subject: 'Sending Email using Node.js',
    text: `${qty} ${qty == 1 ? "ticket has" : "tickets have"} been released for ${dateInfo.artist_name} ${dateInfo.tour_name} at ${dateInfo.venue_name}, ${dateInfo.city} on ${datefns.format(new Date(dateInfo.date), "EEEE do LLLL yyyy")}`
}


function sendTicketsReleasedEmail(a) {
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: ['phillipai@hotmail.com', ...emailList],
        subject: 'Sending Email using Node.js',
        text: `${qty} ${qty == 1 ? "ticket has" : "tickets have"} been released for ${dateInfo.artist_name} ${dateInfo.tour_name} at ${dateInfo.venue_name}, ${dateInfo.city} on ${datefns.format(new Date(dateInfo.date), "EEEE do LLLL yyyy")}`
    }

    sendEmail(mailOptions)
}

