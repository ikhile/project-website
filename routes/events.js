import express from 'express'
import api, { checkAuthRedirect } from '../index.js'
import * as db from '../database.js'
import * as helpers from '../helpers.js'

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

router.get('/tour/:tour_id', async (req, res) => {

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

router.get('/tour/:tour_id/waiting-list', checkAuthRedirect, async (req, res) => {
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
        venues: await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data)
    }

    res.render('events/waiting-list-signup', context)
})

router.post('/tour/:tour_id/waiting-list', checkAuthRedirect, async(req, res) => {
    // const redirectUrl = new URL(req.originalUrl) // can't set search params and only using relative path
    let redirectUrl = req.originalUrl

    console.log(req.search) // could use that to check if there's params already

    try {
        await db.addUserToWaitingList(req.user.user_id, req.body.dates, req.body.qty)
        redirectUrl += (/\?/.test(req.originalUrl) ? "&" : "?") + "alert=success"

    } catch (err) {
        console.error(err)
        redirectUrl += (/\?/.test(req.originalUrl) ? "&" : "?") + "alert=error"
    }

    // https://community.nodemailer.com/2-0-0-beta/templating/
    var transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    })

    let template = `
    <h1>Hello{{user}}<p>
    `

    console.log(dateInfo)

    let text = `You have signed up to be notified when ${req.body.qty} tickets have been released for ...`
    
    var mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: req.user.email,
        subject: 'Signed up for waiting list',
        text: text
    }
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })

    res.redirect(redirectUrl)
})

router.get('/purchase/tour/:tour_id/queue/', checkAuthRedirect, async (req, res) => {
    console.log(req.user)
    let context = {
        req,
        layout: req.isAuthenticated() ?'main-logged-in' : 'main',
        event: await db.getEventById(req.params.tour_id),
        qry: req.query
    }

    res.render('queue', context)

    // could add user to queue here
})

// router.get('/purchase/slot/:slot_id/', async (req, res) => {
//     // check signed up for slot
//     // if so, redirect to purchase page - purchase page must have redirect
//     // if not, redirect to tour page
// })

async function checkSlotAuth(req, res, next) {
    // MAYBE check first if tour has open or future slots
    // if so then check if user is signed up
    // if not then send a lil "you are not signed up to this purchase slot" page with a back button to tour page
    // if so then pass slot id/slot sale = true through to context and render page

    // put this in a middleware - checkSlotAuth or similar

    let slots = await db.getSlotsByTour(req.params.tour_id)
    let hasOpenSlot = false, openSlot = true, hasFutureSlots = false//, authorisedForSlot = false

    for (let slot of slots) {
        if (helpers.slotOngoing(slot)) {
            hasOpenSlot = true
            openSlot = slot
            break
        } else if (helpers.slotFuture(slot)) {
            hasFutureSlots = true
        }
    }

    console.log(req.protocol + '://' + req.get('host') + req.originalUrl) // https://dev.to/smpnjn/how-to-get-the-full-url-in-express-on-nodejs-2h23

    let redirectUrl = new URL((req.protocol + '://' + req.get('host') + req.originalUrl).replace("/purchase", ""))

    if (hasOpenSlot) {
        // check user authenticated for slots
        console.log("open slot")
        let [[{authorisedForSlot}]] = await db.pool.query(`
            SELECT EXISTS(SELECT * FROM slot_registrations WHERE user_id = ? AND slot_id = ?) as authorisedForSlot
        `, [req.user.user_id, openSlot.slot_id])
        console.log(2, Boolean(authorisedForSlot))

        authorisedForSlot = Boolean(authorisedForSlot)
        if (authorisedForSlot) {
            res.locals.isSaleSlot = true
            req.slotID = openSlot.slot_id
            return next() // https://stackoverflow.com/a/53557817
        } else {
            redirectUrl.searchParams.set("alert", "not-authorised")
            res.redirect(redirectUrl)
        }
    }
    
    if (hasFutureSlots) {
        // say can't purchase yet
        console.log("not auth")
        // res.send("to purchase tickets for this tour, please sign up to one of the purchase slots [link to tour page]")

        redirectUrl.searchParams.set("alert", "future-slots")
        res.redirect(redirectUrl)
        // nah actually i should redirect to tour page with an alert
    }

    return next()
}

router.get(
    [
        '/purchase/tour/:tour_id/', 
        '/purchase/tour/:tour_id/venue',
        '/purchase/tour/:tour_id/venue/:venue_id',
        // '/purchase/slot/:slot_id/tour/:tour_id/',
        // '/purchase/slot/:slot_id/tour/:tour_id/venue'
    ], checkAuthRedirect, checkSlotAuth, async (req, res) => {

    console.log(!!req.params.venue_id)

    console.log(2, !!res.locals.isSaleSlot)
    let tour_id = req.params.tour_id
    // if (!!req.params.slot_id) {
    //     // check authorised - if not, redirect to purchase page
    //     const slot = await db.getSlotById(req.params.slot_id)
    //     console.log(slot)
    //     tour_id = await slot.tour_id
    // }

    

    // console.log(await slots)

    // console.log(tour_id)

    let context = {
        req,
        layout: req.isAuthenticated() ? 'main-logged-in' : 'main',
        cardContext: {
            event: await api.get(`tours/${tour_id}`).then((res) => res.data),
            venues: await api.get(`tours/${tour_id}/venues`).then((res) => res.data),
        },
        tour: await db.getEventById(tour_id),
        venueSelected: false,
        isPurchaseSlotSale: !!req.isSaleSlot, // use when getting available tickets to get slot
        slotID: req.slot_id
    }

    res.render('events/purchase-page', context)
})

router.get(['/purchase/tour/:tour_id/venue/:venue_id', '/purchase/slot/:slot_id/venue/:venue_id'], checkAuthRedirect, checkSlotAuth, async (req, res) => {

    console.log(2, !!res.locals.isSaleSlot)


    let context = {
        req,
        layout: req.isAuthenticated() ?'main-logged-in' : 'main',
        cardContext: {
            event: await api.get(`tours/${req.params.tour_id}`).then((res) => res.data),
            venues: await api.get(`tours/${req.params.tour_id}/venues`).then((res) => res.data),
        },
        tour: await db.getEventById(req.params.tour_id),
        venue: await db.getVenueById(req.params.venue_id),
        venueDates: await db.getDatesByTourAndVenue(req.params.tour_id, req.params.venue_id),
        maxTickets: await api.get(`tours/${req.params.tour_id}/max`).then((res) => res.data.max_tickets),
        venueSelected: true
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
    //     res.status(404).render('events/404')
    //     return
    // }

    // let context = {
    //     artist: artist[0].artist.label,
    //     tours: loadArtist(req.params.artist),
    // }

    // res.render('events/artist', context)
    res.send(`artist page (artist = ${req.params.artist_id})`)
})
