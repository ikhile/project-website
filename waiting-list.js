import * as db from './database.js'

export async function releaseTickets() {}
export async function unreleaseTickets() {}

// will use a different function to actually release the tickets, i.e. update in the db that they are back on sale
export async function notifyTicketsReleased(dateID, qty) {
    let users = await db.findUsersOnWaitingListByDateId(dateID)
    let emailList = []

    for (let user of users) {
        let regex = new RegExp(`{[\^{]*?"date_id":${dateID}.*?}`)
        let obj = JSON.parse(user.waiting_lists.match(regex)[0])

        if (qty >= obj.qty) { // if released as many or more tickets than user wants
            emailList.push(user.email)
        }
    }

    // then send emails to these users
    return emailList
}

console.log(await notifyTicketsReleased(3, 10))