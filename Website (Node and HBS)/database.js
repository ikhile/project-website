import mysql from 'mysql2'
import dotenv from 'dotenv'
dotenv.config()

export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
}).promise()

export async function getAllEvents() {
    const [rows] = await pool.query(`
        SELECT tour_id, artist_name, tour_name
        FROM tours
        INNER JOIN artists ON tours.artist_id = artists.artist_id;`
    )
    return rows
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

// const events = await getAllEvents()
console.log(await getVenueById(1))
// process.exit()