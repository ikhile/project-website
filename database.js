import mysql from 'mysql2'
import dotenv from 'dotenv'
import { parseArray, stringifyArray } from './index.js'
dotenv.config()

export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    dateStrings: true // https://stackoverflow.com/a/52398828
}).promise()

export async function getAllEvents(limit = null) {
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

    let query = `
        SELECT 
            tours.tour_id, 
            tour_name, 
            artists.artist_id, 
            artist_name, 
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
    if (slots.length == 0) return new Date("2000-01-01") // random past date to compare to
    else return (new Date(slots[0].start))
}

export async function getEventById(tourID) {
    // need: artist, tour, cities, dates, venues
    const [rows] = await pool.query(`
        SELECT tour_id, artist_name, tour_name
        FROM tours
        INNER JOIN artists ON tours.artist_id = artists.artist_id
        WHERE tour_id = ?
    `, tourID)

    return rows[0]
}

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

// export async function

// this is a really similar name to below lol
export async function getTourDatesGroupedByVenue(tourID) {
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
                dates: []
            })
            venueInd = arr.length - 1
        }


        arr[venueInd].dates.push(row)
    }

    return arr
}

export async function getDatesByTourAndVenue(tourID, venueID) {
    const [rows] = await pool.query(`
        SELECT date_id, date
        FROM dates
        WHERE tour_id = ? AND venue_id = ?
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
    const [info] = await pool.query(`
        SELECT date, artist_name, tour_name, venue_name, city
        FROM dates
        INNER JOIN venues on dates.venue_id = venues.venue_id
        INNER JOIN tours ON dates.tour_id = tours.tour_id
        INNER JOIN artists ON tours.artist_id = artists.artist_id
        WHERE date_id = ?
    `, dateID)

    return info
}

export async function getVenueById(venueID) {
    const [rows] = await pool.query(`
        SELECT *
        FROM venues
        WHERE venue_id = ?
        LIMIT 1
    `, venueID)

    return rows[0]
}

export async function getAllArtists() {
    const [rows] = await pool.query(`
        SELECT *
        FROM artists
    `)

    return rows
}

export async function search(searchTerm) {
    // https://stackoverflow.com/questions/28717868/sql-server-select-where-any-column-contains-x#comment-105517868
    // https://www.w3schools.com/sql/sql_like.asp

    // let value = `%${searchTerm}%`
    // let values = ("%" + searchTerm + "%").repeat(4)
    // let values = new Array(4).fill(`%${searchTerm}%`, 0, 4)

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

// STRIPE

export async function updateStripeID(userID, stripeID) {
    await pool.query(`
        UPDATE users
        SET stripe_id = ?
        WHERE user_id = ?
    `, [stripeID, userID])

    return await getUserById(stripeID)
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


export async function getTourQueue(tourID) {
    let [[{queue_exists}]] = await pool.query(`SELECT EXISTS(SELECT * FROM queues WHERE tour_id = ?) as "queue_exists"`, tourID)
    
    // console.log(queue_exists)

    if (!queue_exists) {
        await pool.query(`INSERT INTO queues (tour_id) VALUES(?)`, tourID)
    }

    const [[queue]] = await pool.query(`SELECT * from queues WHERE tour_id = ?`, tourID)    

    // if (!queue.length) {
    //     await pool.query(` INSERT INTO queues (tour_id) VALUES(?)`, tourID)
    //     [queue = await pool.query(`SELECT * from queues WHERE tour_id = ?`, tourID)    
    // }

    // console.log(queue)
    return queue
}

// console.log(2, await getTourQueue(1))

export async function addUserToQueue(tourID, userID) {
    const queueObj = await getTourQueue(tourID)
    console.log(queueObj, queueObj.queue_id)

    let queueArr = parseArray(queueObj.queue) // since i return the array could i just tack filter on here?
    console.log(queueArr)
    queueArr = queueArr.filter(a => a != userID)

    queueArr.push(userID)

    console.log(queueArr, stringifyArray(queueArr))

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

export async function addUserToWaitingList(userID, dateIDs, qty) {

    let [[{waiting_lists: waitingLists}]] = await pool.query(`
        SELECT (waiting_lists) FROM users WHERE user_id = ?
    `, userID)

    waitingLists = !!waitingLists ? JSON.parse(waitingLists) : []

    for (let dateID of dateIDs) {
        let insertObj = { date_id: dateID, qty: qty }
        let ind = waitingLists.findIndex(a => a.date_id == dateID)
        if (ind >= 0) waitingLists[ind] = insertObj
        else waitingLists.push(insertObj)
    }

    waitingLists = JSON.stringify(waitingLists)

    await pool.query(`
        UPDATE users
        SET waiting_lists = ?
        WHERE user_id = ?
    `, [waitingLists, userID])

    // EMAIL USER
    const { email } = await getUserById(userID)
    console.log(await email)
} 

// addUserToWaitingList(1, [2, 3, 5], 3)

export async function findUsersOnWaitingListByDateId(dateID) {
    const [users] = await pool.query(`SELECT * FROM users WHERE waiting_lists REGEXP '\"{0,1}date_id\"{0,1}:\"{0,1}?\"{0,1}'`, dateID) // can't use ? for optional char as already used for wildcard
    return users
}

// console.log(await findUsersOnWaitingListByDateId(1))

// export async function 

export async function addOrder(session, user, tour, venue, date, seats, meta) {
    /*stripe_order_id VARCHAR(255),
    user_id INT,
    tour_id INT,
    date_id INT,
    seat_ids VARCHAR(255),
 --   status VARCHAR(255), -- set pending from success page, use webhook to set complete
    stripe_metadata TEXT,
    on_waiting_list BOOLEAN, */

    return await pool.query(`
        INSERT INTO orders (stripe_session_id, user_id, tour_id, venue_id, date_id, seat_ids, stripe_metadata)
        VALUES(?, ?, ?, ?, ?, ?, ?)
    `, [session, user, tour, venue, date, stringifyArray(seats), meta])
}

export async function getUserOrders(userID) {
    const [orders] = await pool.query(`
    SELECT order_id, orders.date_id, date, orders.tour_id, tour_name, artist_name, orders.venue_id, venue_name, city, stripe_session_id, on_waiting_list, seat_ids
    FROM orders 
    INNER JOIN tours ON orders.tour_id = tours.tour_id
    INNER JOIN artists ON tours.artist_id = artists.artist_id
    INNER JOIN venues ON orders.venue_id = venues.venue_id
    INNER JOIN dates ON orders.date_id = dates.date_id
    WHERE user_id = 1;
    `, userID)
    return orders
}

export async function getSlotsByTour(tourID) {
    const [slots] = await pool.query(`
        SELECT * 
        FROM purchase_slots
        WHERE tour_id = ?
        ORDER BY start ASC
    `, tourID)

    return slots
}

export async function getSlotById(slotID) {
    const [[slot]] = await pool.query(`
        SELECT * 
        FROM purchase_slots
        WHERE slot_id = ?
    `, slotID)

return slot
}

export async function slotSignUp(userID, slotID) {
    await pool.query("INSERT INTO slot_registrations (user_id, slot_id) VALUES(?, ?)", [userID, slotID])
}

export async function removeSlotSignup(userID, slotID) {
    await pool.query("DELETE FROM slot_registrations WHERE user_id = ? AND slot_id = ?", [userID, slotID])
}

export async function getUsersForSlot(slotID) {
    const [signups] = await pool.query("SELECT * FROM slot_registrations WHERE slot_id = ?", slotID)
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