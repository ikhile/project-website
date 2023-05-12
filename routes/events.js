import express from 'express'
import api, { checkAuthRedirect } from '../index.js';
import * as db from '../database.js';

export const router = express.Router();
export const stringifyLog = (input) => console.log(JSON.stringify(input, null, 2))

router.get('/', async (req, res) => {
    let events =  await db.getAllEvents()
    
    for (let event of events) {
        event.dates = await api.get(`tours/${event.tour_id}/dates`).then((res) => res.data)
        event.firstDate = await api.get(`tours/${event.tour_id}/dates/first`).then((res) => res.data)
        event.lastDate = await api.get(`tours/${event.tour_id}/dates/last`).then((res) => res.data)
        event.purchaseSlots = await db.getPurchaseSlots(event.tour_id)
        event.salesStart = await db.tourSalesStart(event.tour_id)
    }

    const context = {
        isAuth: req.isAuthenticated(),
        user: req.user,
        events: events
    }

    res.render('events/events', context)
})

router.get('/tour/:tour_id', async (req, res) => {

    const event = await api.get(`tours/${req.params.tour_id}`).then((res) => res.data)
    const venues = await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data)
    const dates = await db.getTourDates(req.params.tour_id)

    // if is on sale, all seats for that tour will have onsale = true
    let isOnsale = await api.get(`tours/${req.params.tour_id}/all-onsale`).then(res => res.data.allOnsale)

    let context = {
        event: event,
        venues: venues,
        onsale: isOnsale,
        dates: dates
    }

    if (isOnsale) {
        context.cardContext = {
            event: event,
            venues: venues
        }

    } else {
        context.slots = await api.get(`/tours/${req.params.tour_id}/purchase-slots`).then(res => res.data)
    }
    
    res.render('events/tour', context)
})

router.get('/tour/:tour_id/waiting-list', async (req, res) => {
    const tourID = req.params.tour_id
    const venueID = req.query.venue

    // will want to check if user (if logged in) is already signed up to waiting list
    // if not, will want to check if email is already signed up in db using form validation

    let context = {
        user: req.user,
        // userSignedUp: // check db for user id
        tour: await api.get(`tours/${req.params.tour_id}`).then((res) => res.data),
        venues: await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data)
    }

    res.render('events/waiting-list-signup', context)
})

router.get('/purchase/tour/:tour_id/queue/', checkAuthRedirect, async (req, res) => {
    let context = {
        event: await db.getEventById(req.params.tour_id),
        qry: req.query
    }

    res.render('queue', context)
})

router.get('/purchase/tour/:tour_id/', checkAuthRedirect, async (req, res) => {
    console.log(req.originalUrl)
    let context = {
        cardContext: {
            event: await api.get(`tours/${req.params.tour_id}`).then((res) => res.data),
            venues: await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data),
        }
    }

    res.render('events/choose-venue', context)
})

router.get('/purchase/tour/:tour_id/venue/:venue_id', checkAuthRedirect, async (req, res) => {

    let context = {
        cardContext: {
            event: await api.get(`tours/${req.params.tour_id}`).then((res) => res.data),
            venues: await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data),
        },
        tour: await db.getEventById(req.params.tour_id),
        venue: await db.getVenueById(req.params.venue_id),
        venueDates: await db.getDatesByTourAndVenue(req.params.tour_id, req.params.venue_id)
    }

    // don't think I need any of this? not sure why I started it tbh
    // const params = new URLSearchParams(req.query)
    // const qryDates = params.getAll("date")
    // if (qryDates.length == 0 || qryDates.length == context.venueDates.length) {
    //     // console.log("get all dates")
    //     // use req.query to get ticket info for all selected dates and send in context
    // }
    // use req.query to return available seats for number of tickets
    // 
    // console.log(context.cardContext)

    res.render('events/purchase-page', context)
})

router.get('/artist/:artist_id', (req, res) => {
    // res.send("artist id: " + req.params.artist_id)
    // let artist = loadArtist(req.params.artist)

    // if (!artist) {
    //     res.status(404).render('events/404');
    //     return
    // }

    // let context = {
    //     artist: artist[0].artist.label,
    //     tours: loadArtist(req.params.artist),
    // }

    // res.render('events/artist', context)
    res.send(`artist page (artist = ${req.params.artist_id})`)
})
