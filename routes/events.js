import express from 'express'
import api, { checkAuthRedirect, parseArray } from '../index.js'
import * as db from '../database.js'
import * as helpers from '../helpers.js'
import dotenv from 'dotenv';
import { sendEmail } from '../emails.js'
import { retrieveStripeSession } from '../stripe.js'
dotenv.config()

export const router = express.Router()
export const stringifyLog = (input) => console.log(JSON.stringify(input, null, 2))

router.get('/', async (req, res) => {
    let events =  await db.getAllEvents()
    
    for (let event of events) {
        event.dates = await api.get(`tours/${event.tour_id}/dates`).then((res) => res.data)
        event.firstDate = await api.get(`tours/${event.tour_id}/dates/first`).then((res) => res.data)
        event.lastDate = await api.get(`tours/${event.tour_id}/dates/last`).then((res) => res.data)
        event.purchaseSlots = await db.getSlotsByTour(event.tour_id)
        event.salesStart = await db.tourSalesStart(event.tour_id)
        // console.log(await event.salesStart)
    }

    const context = {
        req,
        layout: req.isAuthenticated() ? 'main-logged-in' : 'main', // nav bar doesn't automatically changed based on isAuth - this works https://stackoverflow.com/a/58386111
        isAuth: req.isAuthenticated(),
        user: req.user,
        events: events
    }

    res.render('events/events', context)
})

router.get('/tour/:tour_id', validateTourID, async (req, res) => {

    const event = await api.get(`tours/${req.params.tour_id}`).then((res) => res.data)
    const venues = await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data)
    const dates = await db.getTourDates(req.params.tour_id)

    let [prices] = await db.pool.query(`
        SELECT DISTINCT price
        FROM seats
        INNER JOIN dates ON dates.date_id = seats.date_id
        WHERE tour_id = ?
    `, req.params.tour_id)

    prices = prices.map(price => parseFloat(price.price)).sort((a, b) => a - b)
    
    let isOnsale = await api.get(`tours/${req.params.tour_id}/all-onsale`).then(res => res.data.allOnsale)

    let context = {
        req,
        layout: req.isAuthenticated() ?'main-logged-in' : 'main',
        event: event,
        venues: venues,
        onsale: isOnsale,
        dates: dates,
        prices
    }

    if (isOnsale) {
        context.cardContext = {
            event: event,
            venues: venues
        }

    } else {
        context.slots = await api.get(`/tours/${req.params.tour_id}/purchase-slots`).then(res => res.data)
        context.userSignedUpSlots = !!req.user ? await db.getUserTourSlots(req.user.user_id, req.params.tour_id) : []
    }
    
    res.render('events/tour', context)
})

router.get('/tour/:tour_id/waiting-list', validateTourID, checkAuthRedirect, async (req, res) => {
    const tourID = req.params.tour_id
    const venueID = req.query.venue

    let context = {
        req,
        layout: req.isAuthenticated() ?'main-logged-in' : 'main',
        user: req.user,
        tour: await api.get(`tours/${req.params.tour_id}`).then((res) => res.data),
        venues: await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data),
        maxTickets: await api.get(`tours/${req.params.tour_id}/max`).then(res => res.data.max_tickets)
    }

    res.render('events/waiting-list-signup', context)
})

router.post('/tour/:tour_id/waiting-list', validateTourID, checkAuthRedirect, async(req, res) => {
    let redirectUrl = req.originalUrl
    let tour = await db.getEventById(req.params.tour_id)

    try {
        await db.addUserToWaitingList(req.user.user_id, req.body.dates, req.body.qty)
        redirectUrl += (/\?/.test(req.originalUrl) ? "&" : "?") + "alert=success"

    } catch (err) {
        console.error(err)
        redirectUrl += (/\?/.test(req.originalUrl) ? "&" : "?") + "alert=error"
    }

    try {
        sendEmail(
            req.user.email,
            "You have signed up to the waiting list",
            `Dear ${req.user.first_name}
            You have signed up to the waiting list for ${tour.artist_name} ${tour.tour_name} and will be notified when ${req.body.qty} or more tickets are released.`
        )

    } catch (err) {
        console.error(err)
        redirectUrl += (/\?/.test(req.originalUrl) ? "&" : "?") + "alert=email-error"
    }

    res.redirect(redirectUrl)
})

router.get('/purchase/tour/:tour_id/queue/', validateTourID, checkAuthRedirect, checkSlotAuth, async (req, res) => {
    let context = {
        req,
        layout: req.isAuthenticated() ?'main-logged-in' : 'main',
        event: await db.getEventById(req.params.tour_id),
        venue_id: req.query.venue,
        slot_id: res.locals.openSlot ? res.locals.openSlot.slot_id : null
    }

    console.log(context.slot_id)

    let availableSeats, totalSeats, prices
    const {tour_id} = req.params

    const baseSeatQuery = `
        SELECT COUNT(*) AS count
        FROM seats
        INNER JOIN dates ON seats.date_id = dates.date_id
        WHERE tour_id = ? `

    const basePriceQuery = `
        SELECT price FROM seats
        INNER JOIN dates ON seats.date_id = dates.date_id
        WHERE available = true
        AND tour_id = ? `

    if (req.query.venue) {
        const totalQuery = baseSeatQuery + " AND venue_id = ?"
        const availableQuery = totalQuery + " AND available = true"

        ;(
            [[{count: totalSeats}]] = await db.pool.query(totalQuery, [tour_id, req.query.venue])
        )

        ;(
            [[{count: availableSeats}]] = await db.pool.query(availableQuery, [tour_id, req.query.venue])
        )

        const priceQuery = basePriceQuery + "AND venue_id = ?"

        ;(
            [prices] = await db.pool.query(priceQuery, [tour_id, req.query.venue])
        )

        prices = prices.map(obj => parseFloat(obj.price))

    } else {

        const availableQuery = baseSeatQuery + "AND available = true"

        ;(
            [[{count: totalSeats}]] = await db.pool.query(baseSeatQuery, tour_id)
        )

        ;(
            [[{count: availableSeats}]] = await db.pool.query(availableQuery, tour_id)
        )

        ;(
            [prices] = await db.pool.query(basePriceQuery, tour_id)
        )

        prices = prices.map(obj => parseFloat(obj.price))
    }

    context.availability = {
        decimal: totalSeats > 0 ? availableSeats / totalSeats : 0,
        percent: totalSeats > 0 ? availableSeats / totalSeats * 100 : 0,
        percentage: totalSeats > 0 ? (parseFloat((availableSeats / totalSeats * 100).toFixed(2)) + "%") : "0%",
    }

    context.prices = {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
        avg: prices.length > 0 ? prices.reduce((a, b) => a + b) / prices.length : 0
    }


    res.render('events/queue', context)
})

router.get(
    [
        '/purchase/tour/:tour_id/', 
        '/purchase/tour/:tour_id/venue',
        '/purchase/tour/:tour_id/venue/:venue_id',
    ], 

    validateTourID, validateVenueID, checkAuthRedirect, checkSlotAuth, async (req, res) => {

    let context = {
        req,
        layout: req.isAuthenticated() ? 'main-logged-in' : 'main',
        cardContext: {
            event: await api.get(`tours/${req.params.tour_id}`).then((res) => res.data),
            venues: await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data),
            slotID: req.query.slot_id ?? null
        },
        tour: await db.getEventById(req.params.tour_id),
        venueSelected: !!req.params.venue_id,
        isSlotSale: !!res.locals.isSlotSale, // use when getting available tickets to get slot
        slotID: req.query.slot_id ?? null
    }

    if (!!req.params.venue_id) {
        context.venue = await db.getVenueById(req.params.venue_id)
        context.venueDates = await db.getDatesByTourAndVenue(req.params.tour_id, req.params.venue_id)
        context.maxTickets = await api.get(`tours/${req.params.tour_id}/max`).then((res) => res.data.max_tickets)
    }
    
    res.render('events/purchase-page', context)
})

router.get('/purchase/success', async (req, res) => {
    const session = await retrieveStripeSession(req.query.session)
    const dateID = parseInt(session.metadata.date_id)
    const seatIDs = parseArray(session.metadata.seat_ids)
    let context = {
        layout: req.isAuthenticated() ? 'main-logged-in' : 'main',
        session,
        dateID,
        seatIDs,
        seats: await db.getSeats(...seatIDs),
        qty: seatIDs.length,
        total: session.amount_total / 100,
    }

    for (let [key, value] of Object.entries(await db.getDateInfo(dateID))) {
        context[key] = value
    }

    stringifyLog(await context)

    res.render('events/success', context)
})


// MIDDLEWARE 

async function checkSlotAuth(req, res, next) {

    let slots = await db.getSlotsByTour(req.params.tour_id)
    let hasOpenSlot = false, openSlot = true, hasFutureSlots = false

    for (let slot of slots) {
        if (helpers.slotOngoing(slot)) {
            hasOpenSlot = true
            openSlot = slot
            console.log(200, openSlot)
            res.locals.openSlot = openSlot
            break
        } else if (helpers.slotFuture(slot)) {
            hasFutureSlots = true
        }
    }

    // https://dev.to/smpnjn/how-to-get-the-full-url-in-express-on-nodejs-2h23
    let redirectUrl = new URL((req.protocol + '://' + req.get('host') + req.originalUrl).replace("/purchase", ""))

    if (hasOpenSlot) {
        // check if user is authenticated for open slot
        let [[{authorisedForSlot}]] = await db.pool.query(`
            SELECT EXISTS(SELECT * FROM slot_registrations WHERE user_id = ? AND slot_id = ?) as authorisedForSlot
        `, [req.user.user_id, openSlot.slot_id])
        authorisedForSlot = Boolean(authorisedForSlot)

        // if authorised, pass ID of slot to router/renderer
        if (authorisedForSlot) {
            res.locals.isSlotSale = true
            res.locals.slotID = openSlot.slot_id
            return next() // https://stackoverflow.com/a/53557817

        // else redirect to main tour page query string to show info
        } else {
            redirectUrl.searchParams.set("alert", "not-authorised")
            res.redirect(redirectUrl)
        }
    }
    
    // if no open slot but there are upcoming slots for this tour, redirect to main tour page query string to show info
    if (hasFutureSlots) {
        redirectUrl.searchParams.set("alert", "future-slots")
        res.redirect(redirectUrl)
    }

    // continue to main router if no slots involved
    return next()
}

async function validateTourID(req, res, next) {
    const [[{exists}]] = await db.pool.query(`
        SELECT EXISTS (SELECT tour_id FROM tours WHERE tour_id = ?) as "exists"
    `, req.params.tour_id)
    if (!Boolean(exists)) return res.status(404).render('events/404', { error: "event" })
    next()
}

async function validateVenueID(req, res, next) {
    console.log("validate venue")
    console.log(req.params.venue_id)
    if (req.params.venue_id) {
        console.log("has")
        const [[{exists}]] = await db.pool.query(`
            SELECT EXISTS (SELECT venue_id FROM venues WHERE venue_id = ?) as "exists"
        `, req.params.venue_id)

        console.log(exists)

        if (!Boolean(exists)) return res.status(404).render('events/404', { error: "venue" })
    }
    
    next()
}

