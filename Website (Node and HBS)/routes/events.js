import express from 'express'
import fs from 'fs'
import * as db from '../database.js';
import { groupDates } from '../index.js';
import { createCheckoutSession } from '../stripe.js';

export const router = express.Router();

// might move payments to a "purchase" route... could move purchase page as well yep yep
router.post('/create-checkout-session', async (req, res) => {
    const session = await createCheckoutSession()

    console.log(session)

    res.redirect(303, session.url)
})

router.get('/payment-success', async (req, res) => {
    res.send("payment success")
})

router.get('/payment-cancel', async (req, res) => {
    res.send("payment cancel")
})

router.get('/', async (req, res) => {
    const context = {
        events: await db.getAllEvents()
    }

    console.log(context.events)

    res.render('events', context)
})

router.get('/artist/:artist_id', (req, res) => {
    res.send("artist id: " + req.params.artist_id)
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
})

router.get('/tour/:tour_id', async (req, res) => {
    let context = {
        cardContext: {
            event: await db.getEventById(req.params.tour_id),
            datesByVenue: await db.getTourDatesGroupedByVenue(req.params.tour_id),
            cardUrl: `/events/purchase/tour/${req.params.tour_id}/queue?venue=[VENUE_ID]`
        }
    }

    // will want to establish whether the tour is on sale yet - possibly render different templates
    let isOnsale = true

    if (isOnsale) res.render('events/tour-onsale', context)
    else res.send("not on sale")
})

router.get('/purchase/tour/:tour_id/queue/', async (req, res) => {
    let context = {
        event: await db.getEventById(req.params.tour_id),
        qry: req.query
    }

    res.render('queue', context)
})

// might want this to be city instead... or at least say city in url?
// but tbh I'm not gonna do this in a way that has multiple venues per city lol
router.get('/purchase/tour/:tour_id/venue/:venue_id', async (req, res) => {
    // I assume I'll want to join in the seats for each date grouped by section etc.
    let context = {
        cardContext: {
            event: await db.getEventById(req.params.tour_id),
            datesByVenue: await db.getTourDatesGroupedByVenue(req.params.tour_id),
            cardUrl: `/events/purchase/tour/${req.params.tour_id}/venue/[VENUE_ID]`
        },
        tour: await db.getEventById(req.params.tour_id),
        venue: await db.getVenueById(req.params.venue_id),
        venueDates: await db.getDatesByTourAndVenue(req.params.tour_id, req.params.venue_id)
    }

    const params = new URLSearchParams(req.query)
    const qryDates = params.getAll("date")

    if (qryDates.length == 0 || qryDates.length == context.venueDates.length) {
        console.log("get all dates")
        // use req.query to get ticket info for all selected dates and send in context
    }

    // use req.query to return available seats for number of tickets
    // 

    console.log(context.cardContext)
    res.render('events/purchase/purchase-page', context)
})

router.get('/:artist/:tour', (req, res) => {
    let event = loadTour(req.params.artist, req.params.tour)

    if (!event) {
        res.status(404).render('events-404');
        return
    }

    let isOnsale = false // later get from onsale date in database and compare to today

    // if (isOnsale) {
        let context = {
            originalUrl: req.originalUrl,
            event: event,
            artist: event.artist.label,
            tour: event.tour.label,
            cities: event.cities,
        }
        res.render('events/artist/tour', context)
    // }

    // else {
    //     res.render('tour-before-sale')
    // }    
})

router.get('/:artist/:tour/purchase', (req, res) => {
    let event = loadTour(req.params.artist, req.params.tour)

    if (!event) {
        res.status(404).render('events-404');
        return
    }

    let isOnsale = false // later get from onsale date in database and compare to today

    // approach A - one template
    // use if/else/unless to show different content depending on if the tickets are on sale or not (could simply be a link to sign up vs purchase page + some info about when they go on sale)
    let context = {
        originalUrl: req.originalUrl,
        artist: event.artist.label,
        tour: event.tour.label,
        cities: event.cities,
        onSale: isOnsale,
    }
    res.render('events/artist/tour/purchase', context)

    // approach B - two templates
    // if (isOnsale) {
        // let context = {
        //     originalUrl: req.originalUrl,
        //     artist: event.artist.label,
        //     tour: event.tour.label,
        //     cities: event.cities,
        //     onSale: isOnsale
        // }
        // res.render('events/artist/tour/purchase', context)
    // }

    // else {
    //     res.render('events/artist/tour/purchase/before-sale.hbs')
    // }   


})

// e.g. events/beyonce/renaissance/sign-up OR events/beyonce/renaissance/purchase/sign-up
router.route(['/:artist/:tour/sign-up', '/:artist/:tour/purchase/sign-up']).get((req, res) => {
    // actually just realised I have the purchase slots sign up and the waiting list sign up which are two slightly separate things...
    let city = req.query.city // can use to autofill city on sign up form
    res.send(`Sign up for tickets for ${req.params.artist} ${req.params.tour} at ${req.params.city}`)
})

router.route(['/:artist/:tour/waiting-list', '/:artist/:tour/purchase/waiting-list', '/:artist/:tour/purchase/:city/waiting-list']).get((req, res) => {
    res.send(`Sign up for the waiting list`)
})

router.get('/:artist/:tour/purchase/:city', (req, res, next) => {
    let city = loadCity(req.params.artist, req.params.tour, req.params.city)
    if (!city) { res.status(404).render('events-404'); return }

    isOnsale = true // later get from onsale date in database and compare to today

    if (!isOnsale) { 
        // refactored for clarity
        // res.redirect(req.originalUrl.replace(req.params.city, "sign-up") + `?city=${req.params.city}`) 

        let newUrl = req.originalUrl.replace(req.params.city, "sign-up")
        let cityQuery = "?city=" + req.params.city
        res.redirect(newUrl + cityQuery)
    }

    let context = {
        city: city.city,
        data: city
    }

    res.render('events/artist/tour/purchase/city', context)

})

router.get('/:artist/:tour/purchase/:city/queue', (req, res) => {

    res.send(`You are in the queue for tickets to ${req.params}`)
    // res.render('events/artist/tour/purchase/queue', context)

})



// let db
// fs.readFile("./db.json", function (err, data){
//     db = JSON.parse(data)
//     // console.log("json" + JSON.stringify(db))
// })

// let db2 = [
//     {
//         artist: {
//             key: "beyonce",
//             label: "Beyoncé"
//         },
//         tour: {
//             key: "renaissance",
//             label: "Renaissance World Tour"
//         },
//         cities: [
//             {
//                 city: "London",
//                 dates: [
//                     "2023-05-29",
//                     "2023-05-30",
//                     "2023-06-01",
//                     "2024-02-15",
//                     "2021-02-15",
//                     "2023-06-03",
//                     "2023-06-04"
//                 ]
//             },
//             {
//                 city: "Edinburgh",
//                 dates: [
//                     "2023-05-23"
//                 ]
//             }
//         ]
//     }
// ]

// function getEventsIndexContext() {
//     let context = {
//         events: []
//     }

//     db.forEach(a => {
//         context.events.push({
//             artist: a.artist,
//             tour: a.tour
//         })
//     })

//     // context.sort(/*sort by tour start date*/)

//     return context
// }

// function loadArtist(artistKey) {
//     let artist = db.filter(a => a.artist.key === artistKey)
//     if (artist.length === 0) return null
//     else return artist
// }

// function loadTour(artistKey, tourKey) {
//     return db.find(a => a.artist.key === artistKey && a.tour.key === tourKey)
// }

// function loadCity(artistKey, tourKey, city) {
//     let tour = loadTour(artistKey, tourKey)
//     let c = tour?.cities.find(a => a.city.toUpperCase() == city.toUpperCase())
//     console.log(c)
//     return c
// }

// function send404() {
    
// }