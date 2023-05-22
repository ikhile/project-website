import express from 'express'
import * as db from '../database.js'
import * as datefns from 'date-fns'
import { stringifyLog } from './events.js'
import { parseArray, stringifyArray } from '../index.js'
import { sendEmail } from '../emails.js'

export const router = express.Router()



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
    res.json(await db.getDatesByTourGroupVenues(req.params.tour_id))
})

router.get("/tours/:tour_id/venues/:venue_id", async (req, res) => {
    res.json(await db.getDatesByTourAndVenue(req.params.tour_id, req.params.venue_id))
})

const dateFields = "date_id, date, tour_id, venue_id"

router.get("/tours/:tour_id/dates", async (req, res) => {
    res.json(await db.getTourDates(req.params.tour_id))
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
    const [rows] = await db.pool.query(`
        SELECT date(date), *
        FROM dates 
        INNER JOIN venues ON dates.venue_id = venues.venue_id
        WHERE date_id = ?
    `, req.params.date_id)

    res.json(await rows)
})

router.get("/tours/:tour_id/all-onsale", async (req, res) => {
    let params = req.query
    const [[totalSeats]] = await db.pool.query(`
        SELECT COUNT(onsale) as count 
        FROM seats INNER JOIN dates 
        ON dates.date_id = seats.date_id 
        WHERE tour_id = ?
    `, req.params.tour_id)

    const [[onsaleSeats]] = await db.pool.query(`
        SELECT COUNT(onsale) as count 
        FROM seats INNER JOIN dates 
        ON dates.date_id = seats.date_id 
        WHERE tour_id = ?
        AND onsale = true
    `, req.params.tour_id)

    return res.json({
        allOnsale: totalSeats.count == onsaleSeats.count
    })
})

router.get('/tours/:tour_id/max', async (req, res) => {
    const [[max]] = await db.pool.query(`
        SELECT max_tickets FROM tours WHERE tour_id = ?
    `, req.params.tour_id)

    return res.json(max)
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
    // let dates = req.query.dates.replace(/\[|\]/g, "").split(",").map(a => parseInt(a))
    let dates = parseArray(req.query.dates)
    let onsale = req.query.onsale == "false" ? false : true


    let sql = `
        SELECT * 
        FROM seats 
        WHERE onsale is ? 
        AND available is true
        AND ( `
    let values = [onsale]


    for (let [i, dateID] of dates.entries()) {
        if (Number.isInteger(parseInt(dateID))) {
            if (i != 0) sql += "\nOR "
            sql += "date_id = ?"
            values.push(dateID)
        }
    }

    sql += ") ORDER BY block, section, row_name, seat_number" // so I can check for consecutive seats

    const [rows] = await db.pool.query(sql, values)

    let requiredQty = parseInt(req.query.qty)


    if (requiredQty) { // if asked for a specific quantity of tickets...
        let suitableTickets = []

        for (let i = 0; i < rows.length; i++) {
            // get required number of seats starting at i
            let seatSlice = rows.slice(i, i + requiredQty)
            let seat = rows[i]

            // if need 1 ticket will just return all available seats grouped by location
            // if slice contains required number of seats and the seats are together, add group to seats to return
            if (requiredQty == 1 || (seatSlice.length == requiredQty && areNeighbouringSeats(seatSlice))) {

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
                        dates: [],
                        tickets: [],
                        qty: requiredQty
                    }) - 1
                }

                // JSON doesn't support sets - using set to ensure no duplicates then converting to array
                // suitableTickets[ind].dates.add(seat.date_id)
                // console.log(suitableTickets[ind].dates)

                let date = new Date((await db.getDateFromID(seat.date_id)).date)
                let fullDate = datefns.format(date, 'E do LLLL yyyy')
                let shortDate = datefns.format(date, 'do LLLL')
                let seatNums = seatSlice[0].seat_number + (requiredQty > 1 ? ` - ${seatSlice[seatSlice.length-1].seat_number}` : "" )

                let seatGroup = {
                    date_id: seat.date_id,
                    fullDate: fullDate, 
                    shortDate: shortDate,
                    seat_numbers: seatNums,
                    seat_ids: stringifyArray(seatSlice.map(a => a.seat_id)),
                    seats: seatSlice
                }

                suitableTickets[ind].tickets.push(seatGroup)

                if (!suitableTickets[ind].dates.find(a => a.date_id == seat.date_id)) {
                    suitableTickets[ind].dates.push({date_id: seat.date_id, fullDate: fullDate, shortDate: shortDate})
                }

                suitableTickets[ind].totalPrice = 0
                let total = 0
                for (let seat of seatSlice) total += parseFloat(seat.price)
                let each = total / requiredQty

                suitableTickets[ind].price = {
                    total,
                    totalWithFees: total + 3.99,
                    each,
                }

            }
        }

        // stringifyLog(suitableTickets)

        suitableTickets.sort((a, b) => {
            if (req.query.orderby == "ASC") {
                return a.tickets.seats[0].price - b.tickets.seats[0].price
            } else /*if (req.query.orderby == "DESC")*/ {
                return b.tickets.seats[0].price - a.tickets.seats[0].price
            }
        })

        return res.json(suitableTickets)
    }


    return res.json(rows)
})


router.get("/tours/:tour_id/purchase-slots", async (req, res) => {
    const [slots] = await db.pool.query(`
        SELECT * FROM purchase_slots WHERE tour_id = ?
    `, req.params.tour_id)

    res.json(slots)
})

router.get("/email-available", async (req, res) => {
    res.json({
        emailAvailable: await db.checkEmailAvailable(req.query.email)
    })
})

router.post("/queue-test", async (req, res) => {
    console.log("queue test")
    console.log(req.body, req.body.val)
    await db.pool.query(`
        INSERT INTO queue_test (test) VALUES("${req.body.val}")
    `)
})

router.get("/get-queue", async (req, res) => {
    console.log("get queue")
    // return res.json("h")
    return res.json(await db.getTourQueue(req.query.tour_id))
})

router.post("/user-join-queue", async (req, res) => {
    // console.log("sanity check")
    // console.log(req.body.tour_id)
    // const queue = await db.getTourQueue(req.body.tour_id)

    // console.log(req.user.user_id)
    // console.log(1, req.body.original_url) 

    // // I actually think this is only an issue for testing - user can't refresh the post request but nodemon can
    // if (!req.user) {
    //     return res.redirect("/account/login?redirect=")   // forces refresh of the page, which will then force log in
    // } 
 


    try {
        await db.addUserToQueue(req.body.tour_id, req.body.user_id)
    } catch (err) {
        return res.redirect(req.headers.referer) 
    } 
    
    // if (await db.getQu)
    // const [queue] = await.db.
    // await db.pool.query(`
    //     INSERT INTO queue ()
    // `)
})

router.post("/user-leave-queue", async (req, res) => {
    console.log("leave queue", new Date())
    if (!req.user) {
        return res.redirect(req.originalUrl)
    }

    try {
        await db.removeUserFromQueue(req.body.tour_id, req.user.user_id)
    } catch (err) {
        console.error(err)
    }
})

router.post("/increment-headcount", async (req, res) => {
    await db.incrementHeadcount(req.body.tour_id)
})

router.post("/decrement-headcount", async (req, res) => {
    console.log("decrement")
    await db.decrementHeadcount(req.body.tour_id)
})

router.post("/slot-signup", async (req, res) => {
    await db.slotSignUp(req.body.user_id, req.body.slot_id)
})

router.post("/slot-signup/remove", async (req, res) => {
    await db.removeSlotSignup(req.body.user_id, req.body.slot_id)
})

router.post("/send-email", async (req, res) => {
    sendEmail(req.body.to, req.body.subject, req.body.text)
})
