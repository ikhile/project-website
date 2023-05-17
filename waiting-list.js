import * as db from './database.js'
import * as datefns from 'date-fns'
import { formatDate } from './helpers.js'
import { parseArray } from './index.js'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

export async function releaseTickets(dateID, seatIDs, orderID) {
    // set seat availability to true
    // notify users

    // would also be easier FOR ME to refund the order in stripe automatically
        // although it makes MORE SENSE to only refund once sold again idk if I have time to figure that out

    try {
        seatIDs = parseArray(seatIDs)

        // // update seat availability and status in seats table
        // await db.setSeatAvailability(true, seatIDs)
        // await db.setSeatStatus("available", seatIDs)

        // // update order waiting_list boolean in orders table
        await db.pool.query(`
            UPDATE orders
            SET on_waiting_list = true
            WHERE order_id = ?
        `, parseInt(orderID))

        // notify users on waiting list 
        notifyTicketsReleased(parseInt(dateID), seatIDs.length)

        // refund in stripe (or equiv)
    } catch(err) {
        console.error(err)
    }
}
export async function unreleaseTickets() {}

// will use a different function to actually release the tickets, i.e. update in the db that they are back on sale
export async function notifyTicketsReleased(dateID, qty) {
    console.log("notify")
    let [dateInfo] = await db.getDateInfo(dateID)
    let users = await db.findUsersOnWaitingListByDateId(dateID)
    let userList = []
    let emailList = []

    for (let user of users) {
        let regex = new RegExp(`{[\^{]*?"date_id"?:"?${dateID}"?.*?}`)
        let obj = JSON.parse(user.waiting_lists.match(regex))

        if (qty >= obj.qty) { // if released as many or more tickets than user wants
            userList.push(user)
            emailList.push(user.email)
        }
    }

    // then send emails to these users
    console.log(emailList)
    
    // https://community.nodemailer.com/2-0-0-beta/templating/
    var transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
    })

    let template = `
    <h1>Hello{{user}}<p>
    `

    console.log(dateInfo)
    
    var mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: ['phillipai@hotmail.com', ...emailList],
        subject: 'Sending Email using Node.js',
        text: `${qty} ${qty == 1 ? "ticket has" : "tickets have"} been released for ${dateInfo.artist_name} ${dateInfo.tour_name} at ${dateInfo.venue_name}, ${dateInfo.city} on ${datefns.format(new Date(dateInfo.date), "EEEE do LLLL yyyy")}`
    }
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })
}

// nodemailer has/refers to some email templating stuff but lemme stick to handlebars
function sendEmails(email, template, context) {
    var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pi537@gmail.com',
        pass: ''
    }
    })

    var mailOptions = {
    from: 'pi537@york.ac.uk',
    to: 'phillipai@hotmail.com',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
    }

    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error)
    } else {
        console.log('Email sent: ' + info.response)
    }
    })
}

// console.log(await notifyTicketsReleased(3, 10))