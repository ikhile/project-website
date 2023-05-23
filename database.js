import mysql from 'mysql2'
import dotenv from 'dotenv'
import { parseArray, stringifyArray } from './index.js'
import { sendEmail } from './emails.js'
import * as datefns from 'date-fns'
dotenv.config()

export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    dateStrings: true // means dates are returned as strings without an arbitrarty time added - https://stackoverflow.com/a/52398828
}).promise()


// EVENTS


    // let query = `
    //     SELECT tour_id, artist_name, tour_name
    //     FROM tours
    //     INNER JOIN artists ON tours.artist_id = artists.artist_id
    //     ORDER BY 
    // `

    // using a combination of group concat and substring index to order by start date of tour
    // https://stackoverflow.com/a/10986929
    // https://stackoverflow.com/a/276949  
    // https://stackoverflow.com/a/8631273
    // might be better to order by sale start date ah well

export async function getAllEvents(limit = null) {

    let query = `
        SELECT 
            tours.tour_id, 
            tour_name, 
            artists.artist_id, 
            artist_name, 
            image_name,
            SUBSTRING_INDEX(
                GROUP_CONCAT(date ORDER BY date ASC SEPARATOR ','), ",", 1
            ) AS first_date
        FROM tours
        INNER JOIN artists ON tours.artist_id = artists.artist_id
        INNER JOIN dates ON tours.tour_id = dates.tour_id
        GROUP BY tour_id
        ORDER BY first_date ASC
    `

    let values
    if (!!limit) {
        query += "LIMIT ?"
        values = [limit]
    }
    const [events] = await pool.query(query, values)
    return events
}

export async function tourSalesStart(tourID) {
    const slots = await getSlotsByTour(tourID)
    if (slots.length == 0) return new Date("2000-01-01") // random future date i
    else return (new Date(slots[0].start))
}

export async function getEventById(tourID) {
    // need: artist, tour, cities, dates, venues
    const [rows] = await pool.query(`
        SELECT tour_id, artist_name, tour_name, image_name
        FROM tours
        INNER JOIN artists ON tours.artist_id = artists.artist_id
        WHERE tour_id = ?
    `, tourID)

    return rows[0]
}


// DATES

export async function getTourDates(tourID) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM dates 
        INNER JOIN venues ON dates.venue_id = venues.venue_id
        WHERE tour_id = ?
        ORDER BY date ASC
    `, tourID)

    return rows
}

// this is a really similar name to below lol
export async function getDatesByTourGroupVenues(tourID) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM dates 
        INNER JOIN venues ON dates.venue_id = venues.venue_id
        WHERE tour_id = ?
    `, tourID)

    let arr = []

    // grouping dates
    for (let row of rows) {
        let venueInd = arr.findIndex(a => a.venue == row.venue_name)
        if (venueInd < 0) {
            arr.push({
                venue: row.venue_name,
                venue_id: row.venue_id,
                city: row.city,
                dates: [],
                image_name: row.image_name
            })
            venueInd = arr.length - 1
        }


        arr[venueInd].dates.push(row)
    }

    return arr
}

export async function getDatesByTourAndVenue(tourID, venueID) {
    const [rows] = await pool.query(`
        SELECT date_id, date, venues.image_name
        FROM dates
        INNER JOIN venues ON dates.venue_id = venues.venue_id
        WHERE tour_id = ? AND dates.venue_id = ?
    `, [tourID, venueID])

    return rows
}

export async function getDateFromID(dateID) {
    const [rows] = await pool.query(`
        SELECT date
        FROM dates
        WHERE date_id = ?
    `, dateID)

    return rows[0]
}

export async function getDateInfo(dateID) {
    const [[info]] = await pool.query(`
        SELECT date, artist_name, tour_name, venue_name, city, tours.image_name
        FROM dates
        INNER JOIN venues on dates.venue_id = venues.venue_id
        INNER JOIN tours ON dates.tour_id = tours.tour_id
        INNER JOIN artists ON tours.artist_id = artists.artist_id
        WHERE date_id = ?
    `, dateID)

    return info
}


// VENUES

export async function getVenueById(venueID) {
    const [rows] = await pool.query(`
        SELECT *
        FROM venues
        WHERE venue_id = ?
        LIMIT 1
    `, venueID)

    return rows[0]
}


// ARTISTS

export async function getAllArtists() {
    const [rows] = await pool.query(`
        SELECT *
        FROM artists
    `)

    return rows
}


// SEARCH

export async function search(searchTerm) {
    // https://stackoverflow.com/questions/28717868/sql-server-select-where-any-column-contains-x#comment-105517868
    // https://www.w3schools.com/sql/sql_like.asp

    const [results] = await pool.query(` 
        SELECT *
        FROM tours 
            INNER JOIN artists ON tours.artist_id = artists.artist_id
            INNER JOIN dates ON tours.tour_id = dates.tour_id
            INNER JOIN venues ON dates.venue_id = venues.venue_id
        WHERE 
            tour_name LIKE ?
            OR artist_name LIKE ?
            OR venue_name LIKE ?
            OR city LIKE ?
    `, new Array(4).fill(`%${searchTerm}%`, 0, 4))

    let grouped = []

    function getResultIndex(result) {
        return grouped.findIndex(a => {
            a.tour_id == result.tour_id
            && a.venue_id == result.venue_id
        })
    }

    for (let result of results) {
        let resultIndex = grouped.findIndex(a =>  a.tour_id == result.tour_id && a.venue_id == result.venue_id)

        if (resultIndex < 0) {
            grouped.push({
                tour_id: result.tour_id,
                tour_name: result.tour_name,
                artist_id: result.artist_id,
                artist_name: result.artist_name,
                venue_id: result.venue_id,
                venue_name: result.venue_name,
                city: result.city,
                dates: []
            })
            resultIndex = grouped.length - 1
        }

        grouped[resultIndex].dates.push(result.date)
    }

    return grouped
}


// SEATS

export async function getSeats(...seatIDs) {
    let query = `
        SELECT 
            seat_id, seats.date_id, date, 
            section, block, row_name, seat_number, general_admission, 
            available, price, 
            tours.tour_id, tour_name, 
            artists.artist_id, artist_name, 
            venues.venue_id, venue_name, city
        FROM seats
        INNER JOIN dates ON seats.date_id = dates.date_id
        INNER JOIN tours ON dates.tour_id = tours.tour_id
        INNER JOIN artists ON tours.artist_id = artists.artist_id
        INNER JOIN venues ON dates.venue_id = venues.venue_id
    `
    let values = []

    for (let [i, seatID] of seatIDs.entries()) { // https://stackoverflow.com/a/41221424
        // ohhh it's just destructuring array.entries
        query += `\n${i == 0 ? "WHERE" : "OR"} seat_id = ?`
        values.push(seatID)
    }

    const [seats] = await pool.query(query, values)

    if (seats.length == seatIDs.length) {
        return seats

    } else if (seats.length < seatIDs.length) {
        console.error("Not all seats found - may be an issue with one or more seat IDs")
        // throw new Error("Not all seats found - may be an issue with one or more seat IDs")
        return seats

    } else if (seats.length > seatIDs.length) {
        console.error("Somehow found more seats than expected...")
        return seats
        // throw new Error("Somehow found more seats than expected...")
    }
}

export async function setSeatStatus(status, seatIDs) {
    let query = `
        UPDATE seats
        SET status = ?
    `

    let values = [status]

    for (let [i, seatID] of seatIDs.entries()) {
        query += `\n${i == 0 ? "WHERE" : "OR"} seat_id = ?`
        values.push(seatID)
    }

    const [{affectedRows}] = await pool.query(query, values)

    return affectedRows
}

export async function setSeatAvailability(available, seatIDs) {
    let query = `
        UPDATE seats
        SET available = ?
    `

    let values = [available]

    for (let [i, seatID] of seatIDs.entries()) {
        query += `\n${i == 0 ? "WHERE" : "OR"} seat_id = ?`
        values.push(seatID)
    }

    const [{affectedRows}] = await pool.query(query, values)

    return affectedRows
}


// STRIPE

export async function updateStripeID(userID, stripeID) {
    await pool.query(`
        UPDATE users
        SET stripe_id = ?
        WHERE user_id = ?
    `, [stripeID, userID])

    return await getUserById(stripeID)
}


// USERS

export async function addUser(firstName, lastName, email, hashedPassword) {
    
    try {
    return await pool.query(`
        INSERT INTO users (first_name, last_name, email, password)
        VALUES (?, ?, ?, ?)
    `, [firstName, lastName, email, hashedPassword], 
        async (error, result) => { 
        if (error) {
            return error
        } else {
            return await result[0].insertId
        }
    })
    } catch (error) {
        console.error(error)
    }

}

export async function getUsers() {
    const [users] = await pool.query(`SELECT * FROM users`)
    return users
}

export async function getUserByEmail(email) {
    const [[user]] = await pool.query(`
        SELECT * 
        FROM users
        WHERE email = ?
        LIMIT 1
    `, email)

    return user
}

export async function getUserById(id) {
    const [[user]] = await pool.query(`
        SELECT * 
        FROM users
        WHERE user_id = ?
        LIMIT 1
    `, id)

    return user
}

export async function checkEmailAvailable(email) {
    const [[{exists}]] = await pool.query(`SELECT EXISTS(SELECT * FROM users WHERE email = ?) as "exists"`, email)
    return !exists // not exists == available
}


// QUEUE (cancel this)

export async function getTourQueue(tourID) {
    const [[{queue_exists}]] = await pool.query(`SELECT EXISTS(SELECT * FROM queues WHERE tour_id = ?) as "queue_exists"`, tourID)
    if (!queue_exists) await pool.query(`INSERT INTO queues (tour_id) VALUES(?)`, tourID)
    const [[queue]] = await pool.query(`SELECT * from queues WHERE tour_id = ?`, tourID)    
    return queue
}

export async function addUserToQueue(tourID, userID) {
    const queueObj = await getTourQueue(tourID)
    let queueArr = parseArray(queueObj.queue) // since i return the array could i just tack filter on here?
    queueArr = queueArr.filter(a => a != userID)
    queueArr.push(userID)

    await pool.query(`
        UPDATE queues
        SET queue = ?
        WHERE queue_id = ?
    `, [stringifyArray(queueArr) ,queueObj.queue_id])
}

export async function removeUserFromQueue(tourID, userID) {
    const queueObj = await getTourQueue(tourID)

    let queueArr = parseArray(queueObj.queue)

    if (queueArr.length) {
        queueArr = queueArr.filter(a => a != userID)
    }

    await pool.query(`
        UPDATE queues
        SET queue = ?
        WHERE queue_id = ?
    `, [stringifyArray(queueArr) ,queueObj.queue_id])
}

export async function incrementHeadcount(tourID) {
    await pool.query("UPDATE queues SET headcount = headcount + 1 WHERE tour_id = ?", tourID)
}

export async function decrementHeadcount(tourID) {
    await pool.query("UPDATE queues SET headcount = headcount - 1 WHERE tour_id = ?", tourID)
}


// WAITING LIST

export async function addUserToWaitingList(userID, dateIDs, qty) {

    // for both values = [qty, user_id, date_id]
    let insertQry = "INSERT INTO waiting_list (qty, user_id, date_id) VALUES (?, ?, ?)"
    let updateQry = "UPDATE waiting_list SET qty = ? WHERE user_id = ? AND date_id = ?"

    for (let dateID of dateIDs) {
        const values = [qty, userID, dateID]
        let [[{alreadyOnList}]] = await pool.query(`SELECT EXISTS(SELECT * FROM waiting_list WHERE user_id = ? AND date_id = ?) AS alreadyOnList`, [userID, dateID]); alreadyOnList = Boolean(alreadyOnList)

        if (alreadyOnList) await pool.query(updateQry, values)
        else await pool.query(insertQry, values)
    }
}

export async function findWLUsersByDateAndQty(dateID, qty) {
    const [users] = await pool.query(`
        SELECT * FROM users
        INNER JOIN waiting_list ON waiting_list.user_id = users.user_id
        WHERE date_id = ?
        AND qty >= ?
    `, [dateID, qty])

    return users
}

export async function getUserWaitingLists(userID) {
    const [wl] = await pool.query(`
        SELECT wl_id, date, qty, venue_name, artist_name, tour_name, city 
        FROM waiting_list
        INNER JOIN dates ON waiting_list.date_id = dates.date_id
        INNER JOIN tours ON tours.tour_id = dates.tour_id
        INNER JOIN artists ON artists.artist_id = tours.artist_id
        INNER JOIN venues ON dates.venue_id = venues.venue_id
        WHERE user_id = ?
    `, userID)

    return wl
}


// ORDERS

export async function addOrder(session, user, tour, venue, date, seats, meta) {
    return await pool.query(`
        INSERT INTO orders (stripe_session_id, user_id, tour_id, venue_id, date_id, seat_ids, stripe_metadata)
        VALUES(?, ?, ?, ?, ?, ?, ?)
    `, [session, user, tour, venue, date, stringifyArray(seats), meta])
}

export async function getUserOrders(userID) {
    const [orders] = await pool.query(`
    SELECT order_id, orders.date_id, date, orders.tour_id, tour_name, artist_name, orders.venue_id, venue_name, city, stripe_session_id, on_waiting_list, seat_ids, purchased_at, refunded
    FROM orders 
    INNER JOIN tours ON orders.tour_id = tours.tour_id
    INNER JOIN artists ON tours.artist_id = artists.artist_id
    INNER JOIN venues ON orders.venue_id = venues.venue_id
    INNER JOIN dates ON orders.date_id = dates.date_id
    WHERE user_id = ?
    `, userID) // user id was set to 1 in query that's BAD
    // check every = in here later
    return orders
}

export async function getOrderById(orderID) {
    const [[order]] = await pool.query(`
    SELECT order_id, orders.date_id, date, orders.tour_id, tour_name, artist_name, orders.venue_id, venue_name, city, stripe_session_id, on_waiting_list, seat_ids, purchased_at
    FROM orders 
    INNER JOIN tours ON orders.tour_id = tours.tour_id
    INNER JOIN artists ON tours.artist_id = artists.artist_id
    INNER JOIN venues ON orders.venue_id = venues.venue_id
    INNER JOIN dates ON orders.date_id = dates.date_id
    WHERE order_id = ?
    `, orderID)
    return order
}

// SLOTS

export async function getSlotsByTour(tourID) {
    const [slots] = await pool.query(`
        SELECT * 
        FROM purchase_slots
        WHERE tour_id = ?
        ORDER BY start ASC
    `, tourID)

    return slots
}

export async function getSlots(slotID) {
    const [slots] = await pool.query(`
        SELECT * 
        FROM purchase_slots
        INNER JOIN tours ON tours.tour_id = purchase_slots.tour_id
        INNER JOIN artists ON tours.artist_id = artists.artist_id
        ${ !!slotID ? "WHERE slot_id = ?" : "" }
    `, slotID)

    if (slots.length == 1) return slots[0]
    return slots
}

export async function slotSignUp(userID, slotID) {
    await pool.query("INSERT INTO slot_registrations (user_id, slot_id) VALUES(?, ?)", [userID, slotID])
}

export async function removeSlotSignup(userID, slotID) {
    await pool.query("DELETE FROM slot_registrations WHERE user_id = ? AND slot_id = ?", [userID, slotID])
}

export async function getUsersForSlot(slotID) {
    const [signups] = await pool.query(`
        SELECT * 
        FROM slot_registrations 
        WHERE slot_id = ?`
    , slotID)
    return signups.map(a => a.user_id)
}

export async function isUserSignedUpForSlot(userID, slotID) {
    const [[{isSignedUp}]] = await pool.query("SELECT EXISTS(SELECT * FROM slot_registrations WHERE user_id = ? AND slot_id = ?) as isSignedUp", [userID, slotID])

    return Boolean(parseInt(isSignedUp))
}

export async function getUserSlots(userID) {
    const [slots] = await pool.query("SELECT * FROM slot_registrations WHERE user_id = ?", userID)
    return slots.map(a => a.slot_id)
}

export async function getUserTourSlots(userID, tourID) {
    const [slots] = await pool.query(`
        SELECT * FROM slot_registrations
        INNER JOIN purchase_slots ON slot_registrations.slot_id = purchase_slots.slot_id
        WHERE user_id = ?
        AND tour_id = ?
    `, [userID, tourID])
    return slots.map(a => a.slot_id)
}

// SEATS

export async function addSeats(schema) {
    function arrayFromRange (start, end) {
        if (end < start) [start, end] = [end, start]
        return Array.from(Array(end - start + 1).keys()).map(a => a + start)
    }

    // put together a query using all of the provided seats
    let query = "INSERT INTO seats (date_id, price, purchase_slot_id, section, block, row_name, seat_number, onsale, available) VALUES ", values = [], dateQtyAdded = {}

    for (let row of schema) {
        const seatRange = arrayFromRange(...row.seats)
        if (seatRange.length > dateQtyAdded[row.dateID] || !dateQtyAdded.hasOwnProperty(row.dateID)) dateQtyAdded[row.dateID] = seatRange.length

        for (let [i, seat] of seatRange.entries()) {
            // add a new line of placeholders to query
            query += `(?, ?, ?, ?, ?, ?, ?, ?, ?)` + (i < seatRange.length - 1 ? ",\n" : "")
            // add corresponding values to values array
            values.push(row.dateID, row.price, row.slotID ?? null, row.section, row.block, row.row, seat, false, true)
        }
    }

    // execute query
    await pool.query(query, values)

    // email users on waiting list


    for (let [date, qty] of Object.entries(dateQtyAdded)) { 
        
        // probs need to check the on-sale date of the tour but eh
        // something like select general sale start from dates inner join tours...
        // if start is future
        // then need to use slot ids but this differs for each seat... maybe add to dateQty added?

        // get users on waiting list
        let [users] = await pool.query(`
            SELECT *
            FROM waiting_list 
            INNER JOIN users ON waiting_list.user_id = users.user_id
            WHERE date_id = ? AND qty <= ?`, [date, qty])

        // use users list to send emails
        let dateInfo = await getDateInfo(date)

        sendEmail(
            users.map(user => user.email), 
            `Tickets released for ${dateInfo.tour_name}`,
            `Tickets have been released for ${dateInfo.artist_name} ${dateInfo.tour_name} on ${datefns.format(new Date(dateInfo.date), "EEE do LLLL yyyy")} at ${dateInfo.venue_name}, ${dateInfo.city}`
        )
    }

    return [query, values]
}