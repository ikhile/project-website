import express from 'express'
import * as db from '../database.js';

export const router = express.Router();

router.get("/tours", async (req, res) => {
    res.json(await db.getAllEvents())
})

router.get("/tours/:tour_id", async (req, res) => {
    return res.json(await db.getEventById(req.params.tour_id))
})

router.get("/artists", async (req, res) => {
    res.json(await db.getAllArtists())
})

// router.get("/artists/:artist_id")

router.get("/tours/:tour_id/venues", async (req, res) => {
    res.json(await db.getTourDatesGroupedByVenue(req.params.tour_id))
})

router.get("/tours/:tour_id/venues/:venue_id", async (req, res) => {
    res.json(await db.getDatesByTourAndVenue(req.params.tour_id, req.params.venue_id))
})

router.get("/tours/:tour_id/dates", async (req, res) => {
    console.log()
    res.json(await db.getEventDatesById(req.params.tour_id))
})

router.get("/tours/:tour_id/dates/first", async (req, res) => {
    const [rows] = await db.pool.query(`
        SELECT *
        from dates
        WHERE tour_id = ?
        ORDER BY date
        LIMIT 1
    `, req.params.tour_id)

    return res.json(await rows[0])
})

router.get("/tours/:tour_id/dates/last", async (req, res) => {
    const [rows] = await db.pool.query(`
        SELECT *
        from dates
        WHERE tour_id = ?
        ORDER BY date DESC
        LIMIT 1
    `, req.params.tour_id)

    return res.json(await rows[0])
})

router.get("/tours/:tour_id/dates/:date_id", async (req, res) => {
    let params = req.query
    console.log(params)
    const [rows] = await db.pool.query(`
        SELECT * 
        FROM dates 
        INNER JOIN venues ON dates.venue_id = venues.venue_id
        WHERE date_id = ?
    `, req.params.date_id)

    // return rows
    res.json(await rows)
})

router.get("/seats", async (req, res) => {
    let tour = req.query.tour
    let dates = req.query.dates.replace(/\[|\]/g, "").split(",").map(a => parseInt(a))
    let status = req.query.available ?? "available"
    console.log(req.query, tour, dates, status)

    let sql = "SELECT * FROM seats WHERE "
    let values = []

    for (let i in dates) {
        if (i != 0) sql += "OR "
        sql += "date_id = ? "
        values.push(dates[i])
    }

    sql += "AND onsale is true AND available is ?"

    console.log(sql, [...values, status == "available"])

    // const [rows] = db.pool.query(`
    //     SELECT *
    //     FROM SEATS
    //     WHERE 
    // `)

    const [rows] = await db.pool.query(sql, [...values, status == "available"])

    console.log(await rows)
    res.json(rows)
})


