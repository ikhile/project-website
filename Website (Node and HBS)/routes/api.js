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

function areConsecutiveNumbers(arr) {
    arr = arr.sort((a, b) => a - b)

    return arr[arr.length - 1] - arr[0] == arr.length - 1

    // console.log("!!!", arr, arr.reduce((a, b) => a + b) == (arr.length / 2) * (arr[0] + arr[arr.length - 1]))
    // return arr.reduce((a, b) => a + b) == (arr.length / 2) * (arr[0] + arr[arr.length - 1])
}

function areNeighbouringSeats(seatsArr) {
    console.log(seatsArr)
    let section = seatsArr[0].section, block = seatsArr[0].block, row_name = seatsArr[0].row_name
    return seatsArr.every(a => a.section == section && a.block == block && a.row_name == row_name) && areConsecutiveNumbers(seatsArr.map(a => a.seat_number))
}

router.get("/available-seats", async (req, res) => {
    let tour = req.query.tour
    let dates = req.query.dates.replace(/\[|\]/g, "").split(",").map(a => parseInt(a))
    let sql = `
        SELECT * 
        FROM seats 
        WHERE onsale is true 
        AND available is true
        AND ( `
    let values = []

    for (let i in dates) {
        if (i != 0) sql += "OR "
        sql += "date_id = ? "
        values.push(dates[i])
    }

    sql += ") ORDER BY block, section, row_name, seat_number" // so I can check for consecutive seats

    const [rows] = await db.pool.query(sql, values)

    let requiredQty = parseInt(req.query.qty)


    if (requiredQty && requiredQty > 1) { // if quantity is 1 can return all seats
        let seatGroups = []

        console.log(`need ${requiredQty} tickets`)

        for (let i = 0; i < rows.length; i++) {
            // let seatGroup = [rows[i]]#
            // get required number of seats starting at i
            // console.log(i, i + parseInt(requiredQty))
            let seatSlice = rows.slice(i, i + requiredQty)

            // check if those seats have consecutive numbers and if there are enough seats (in case slice surpassed end of array)
            // console.log(seatSlice.map(a => a.seat_number))
            if (seatSlice.length == requiredQty && areNeighbouringSeats(seatSlice)) {
                seatGroups.push(seatSlice)
            }
            // console.log(i, req.query.qty)
            // console.log(seatSlice.length)
            // for (let j = 0; j < req.query.qty; j++) {
            //     if (i + j < rows.length - 1) {
            //         let seatNum = rows[i + j].seat_number
            //         let nextSeatNum = rows[i + j + 1].seat_number
            //         if (nextSeatNum - seatNum == 1) {
            //             console.log("yep")
            //             seatGroup.push(rows[i + j])
            //         } else {
            //             // break
            //         }
            //         // console.log(i, i+j, j, seatNum, nextSeatNum)
            //     }
            // }
            // if (seatGroup.length >= req.query.qty) console.log(seatGroup)
        }

        return res.json(seatGroups)
    }

    // console.log(seatGroups)
    // for (let group of seatGroups) {
    //     console.log(group.map(a => "Seat number:" + a.seat_number))
    // }

    return res.json(rows)


})


