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
}

function areNeighbouringSeats(seatsArr) {
    let section = seatsArr[0].section, block = seatsArr[0].block, row_name = seatsArr[0].row_name
    return (
        seatsArr.every(seat => seat.section == section && seat.block == block && seat.row_name == row_name) 
        && 
        areConsecutiveNumbers(seatsArr.map(seat => seat.seat_number))
    )
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


    if (requiredQty) { // if asked for a specific quantity of tickets...
        let seatGroups = []
        let suitableTickets = []

        for (let i = 0; i < rows.length; i++) {
            // get required number of seats starting at i
            let seatSlice = rows.slice(i, i + requiredQty)
            let seat = rows[i]

            // if need 1 ticket will just return all available seats grouped by location
            // if slice contains required number of seats and the seats are together, add to group to array of seats to return
            if (requiredQty == 1 || (seatSlice.length == requiredQty && areNeighbouringSeats(seatSlice))) {
                // let blockIndex = suitableTickets.findIndex(a =>  a.block == seat.block)
                
                // if (blockIndex < 0) {
                //     blockIndex = suitableTickets.push({block: seat.block, sections: []}) - 1
                // }

                // // console.log(blockIndex, suitableTickets, suitableTickets[blockIndex])

                // let sectionIndex = suitableTickets[blockIndex].sections.findIndex(a => a.section == seat.section)

                // if (sectionIndex < 0) {
                //     sectionIndex = suitableTickets[blockIndex].sections.push({section: seat.section, rows: []}) - 1
                // }

                // let rowIndex = suitableTickets[blockIndex].sections[sectionIndex].rows.findIndex(a => a.row = seat.row_name)

                // if (rowIndex < 0) {
                //     rowIndex = suitableTickets[blockIndex].sections[sectionIndex].rows.push({row: seat.row_name, availableTickets: []})
                // }

                console.log(seatGroups)
                // if (!suitableTickets.hasOwnProperty(seat.section)) {
                //     suitableTickets[seat.section] = {}
                // }

                // if (!suitableTickets[seat.section].hasOwnProperty(seat.block)) {
                //     suitableTickets[seat.section][seat.block] = {}
                // }

                // if (!suitableTickets[seat.section][seat.block].hasOwnProperty(seat.row_name)) {
                //     suitableTickets[seat.section][seat.block][seat.row_name] = []
                // }

                let ind = suitableTickets.findIndex(a => {
                   return (
                     a.block == seat.block &&
                     a.section == seat.section &&
                     a.row == seat.row_name
                   )
                })

                if (ind < 0) {
                    ind = suitableTickets.push({
                        block: seat.block,
                        section: seat.section,
                        row: seat.row_name,
                        tickets: []
                    }) - 1
                }

                console.log(ind)

                // suitableTickets[seat.section][seat.block][seat.row_name].push(seatSlice)
                suitableTickets[ind].tickets.push(seatSlice)
                seatGroups.push(seatSlice)
            }
        }

        

        return res.json(suitableTickets)
    }

    return res.json(rows)
})


