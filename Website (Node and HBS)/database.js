import mysql from 'mysql2'
import dotenv from 'dotenv'
dotenv.config()

export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    dateStrings: true // https://stackoverflow.com/a/52398828
}).promise()

export async function getAllEvents(limit = null) {
    let query = `
        SELECT tour_id, artist_name, tour_name
        FROM tours
        INNER JOIN artists ON tours.artist_id = artists.artist_id
    `

    let values
    if (!!limit) {
        query += "LIMIT "
        values = [limit]
    }
    const [rows] = await pool.query(query, values)
    return rows
}

export async function getPurchaseSlots(tourID) {
    const [slots] = await pool.query(`
        SELECT * 
        FROM purchase_slots
        WHERE tour_id = ?
        ORDER BY start ASC
    `, tourID)

    return slots
}

export async function tourSalesStart(tourID) {
    const slots = await getPurchaseSlots(tourID)
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

export async function getEventDatesById(tourID) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM dates 
        INNER JOIN venues ON dates.venue_id = venues.venue_id
        WHERE tour_id = ?
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

// const events = await getAllEvents()
// console.log(await getVenueById(1))
// process.exit()