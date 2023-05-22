import * as datefns from 'date-fns'
import * as db from './database.js'
import { sendEmail } from './emails.js'

const slots = await db.getSlots()
// console.log(await slots)
const alertBeforeMins = 10

for (let slot of slots) {
    let timeUntilStart = datefns.differenceInMinutes(new Date(slot.start), new Date())
    let timeUntilAlert = timeUntilStart - alertBeforeMins

    console.log(timeUntilAlert)
    
    if (timeUntilAlert + 2 > 0) {
        setInterval( async function() {
            const users = await db.getUsersForSlot(slot.slot_id) 
            for (let [i, user] of users.entries()) users[i] = await db.getUserById(user)
            sendEmail(
                users.map(user => user.email),
                `Purchase slot for ${slot.artist_name} ${slot.tour_name} starting soon!`,
                `Your registered purchase slot for ${slot.artist_name} ${slot.tour_name} is starting in 10 minutes!`,
            )
        }, timeUntilAlert * 60 * 1000) 
    }

    if (timeUntilStart > 0) {
        setInterval( async function() {
            const users = await db.getUsersForSlot(slot.slot_id) 
            for (let [i, user] of users.entries()) users[i] = await db.getUserById(user)
            sendEmail(
                users.map(user => user.email),
                `Purchase slot for ${slot.artist_name} ${slot.tour_name} starting now!`,
                `Your registered purchase slot for ${slot.artist_name} ${slot.tour_name} is starting now!`,
            )
        }, timeUntilStart * 60 * 1000) 
    }
}

setInterval(function() {
    // console.log("running")
}, 1000)