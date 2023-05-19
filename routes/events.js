import express from 'express'
import api, { checkAuthRedirect } from '../index.js'
import * as db from '../database.js'
import * as helpers from '../helpers.js'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv';import { sendEmail } from '../emails.js'
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
    }

    const context = {
        req,
        // query: req.query,
        layout: req.isAuthenticated() ? 'main-logged-in' : 'main', // nav bar doesn't changed based on isAuth - this works https://stackoverflow.com/a/58386111
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

    // if is on sale, all seats for that tour will have onsale = true
    let isOnsale = await api.get(`tours/${req.params.tour_id}/all-onsale`).then(res => res.data.allOnsale)

    let context = {
        req,
        layout: req.isAuthenticated() ?'main-logged-in' : 'main',
        event: event,
        venues: venues,
        onsale: isOnsale,
        dates: dates,
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

    // will want to check if user (if logged in) is already signed up to waiting list
    // if not, will want to check if email is already signed up in db using form validation

    let context = {
        req,
        layout: req.isAuthenticated() ?'main-logged-in' : 'main',
        user: req.user,
        // userSignedUp: // check db for user id
        tour: await api.get(`tours/${req.params.tour_id}`).then((res) => res.data),
        venues: await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data),
        maxTickets: await api.get(`tours/${req.params.tour_id}/max`).then(res => res.data.max_tickets)
    }

    res.render('events/waiting-list-signup', context)
})

router.post('/tour/:tour_id/waiting-list', validateTourID, checkAuthRedirect, async(req, res) => {
    // const redirectUrl = new URL(req.originalUrl) // can't set search params and only using relative path
    let redirectUrl = req.originalUrl
    let tour = await db.getEventById(req.params.tour_id)

    // console.log(req.search) // could use that to check if there's params already

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

router.get('/purchase/tour/:tour_id/queue/', validateTourID, checkAuthRedirect, async (req, res) => {
    console.log(req.user)
    let context = {
        req,
        layout: req.isAuthenticated() ?'main-logged-in' : 'main',
        event: await db.getEventById(req.params.tour_id),
        queryVenue: req.query.venue
    }

    res.render('queue', context)

    // could add user to queue here
})

router.get(
    [
        '/purchase/tour/:tour_id/', 
        '/purchase/tour/:tour_id/venue',
        '/purchase/tour/:tour_id/venue/:venue_id',
    ], 
    validateTourID, validateVenueID, checkAuthRedirect, checkSlotAuth, async (req, res) => {

    // validate venue ID same way as tour
    // if (req.params.venue_id) {

    // }

    let context = {
        req,
        layout: req.isAuthenticated() ? 'main-logged-in' : 'main',
        cardContext: {
            event: await api.get(`tours/${req.params.tour_id}`).then((res) => res.data),
            venues: await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data),
        },
        tour: await db.getEventById(req.params.tour_id),
        venueSelected: !!req.params.venue_id,
        isSlotSale: !!res.locals.isSlotSale, // use when getting available tickets to get slot
        slotID: res.locals.slot_id ?? null
    }

    if (!!req.params.venue_id) {
        context.venue = await db.getVenueById(req.params.venue_id)
        context.venueDates = await db.getDatesByTourAndVenue(req.params.tour_id, req.params.venue_id)
        context.maxTickets = await api.get(`tours/${req.params.tour_id}/max`).then((res) => res.data.max_tickets)
    }
    
    res.render('events/purchase-page', context)
})


// MIDDLEWARE

async function checkSlotAuth(req, res, next) {
    // MAYBE check first if tour has open or future slots
    // if so then check if user is signed up
    // if not then send a lil "you are not signed up to this purchase slot" page with a back button to tour page
    // if so then pass slot id/slot sale = true through to context and render page

    let slots = await db.getSlotsByTour(req.params.tour_id)
    let hasOpenSlot = false, openSlot = true, hasFutureSlots = false

    for (let slot of slots) {
        if (helpers.slotOngoing(slot)) {
            hasOpenSlot = true
            openSlot = slot
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
    if (req.params.venue_id) {
        console.log("has")
        const [[{exists}]] = await db.pool.query(`
            SELECT EXISTS (SELECT tour_id FROM tours WHERE tour_id = ?) as "exists"
        `, req.params.venue_id)

        if (!Boolean(exists)) return res.status(404).render('events/404', { error: "venue" })
    }
    
    next()
}

