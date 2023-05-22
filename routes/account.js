import express from 'express'
import passport from 'passport'
import * as bcrypt from 'bcrypt'
import * as pconfig from '../passport-config.js'
import * as flash from 'express-flash'
import * as session from 'express-session'
import * as stripe from '../stripe.js'
import * as db from '../database.js'
import * as datefns from 'date-fns'
import { sendEmail } from '../emails.js'
import { checkAuthRedirect, parseArray } from '../index.js'
import { stringifyLog } from './events.js'
import * as wl from '../waiting-list.js'

export const router = express.Router()

pconfig.passportInit(passport)

router.get('/', checkAuthRedirect, async (req, res) => {
    const context = {
        req,
        layout: 'main-logged-in',
        orders: await db.getUserOrders(req.user.user_id), // gonna want some joins - tour name, artist name, venue and city, date
        // then for each seat, parse the array then get each seat from db as well
        // wlError: req.query.hasOwnProperty("wl-error"),
        // wlSuccess: req.query.hasOwnProperty("wl-success"),
        // waitingListSignUps: await db.
        query: req.query,
        waitingLists: await db.getUserWaitingLists(req.user.user_id)
    }

    for (let order of context.orders) {
        const seat_ids = parseArray(order.seat_ids)
        order.seats = await db.getSeats(...seat_ids) // WHY did i use the spread operator here *melt emoji*

        // eligibility for refund - can't do in a helper as uses async to get event date    
        order.purchased_at = new Date(order.purchased_at)
        order.event_date = new Date((await db.getDateFromID(order.date_id)).date)
        if (
            Math.abs(datefns.differenceInDays(new Date(order.purchased_at), new Date())) < 14 
            && Math.abs(datefns.differenceInDays(order.event_date, new Date())) > 7 
        ) { order.eligibleForRefund = true

        } else {
            order.eligibleForRefund = false
            order.refundReason = Math.abs(datefns.differenceInDays(order.event_date, new Date())) < 7 ? "event date" : "purchase date"
        }
    }

    res.render('account/account', context)
})

router.post('/request-refund', async (req, res) => {
    console.log("hello")
    const { "order-id": orderID } = req.body
    const order = await db.getOrderById(orderID)
    const dateInfo = await db.getDateInfo(order.date_id)
    const qty = parseArray(order.seat_ids).length
    const redirect = new URL(req.headers.referer)

    try {
        await refundOrder(orderID)
        redirect.searchParams.set("alert", "refund-success")

    } catch (err) {
        console.error(err)
        redirect.searchParams.set("alert", "refund-error")
        return res.redirect(redirect) // put this in try catch to do a lil alert
    }

    // email users on waiting list
    const usersToNotify = await db.findWLUsersByDateAndQty(order.date_id, qty)

    sendEmail(
        usersToNotify.map(user => user.email),
        "Tickets released",
        `${qty} ${qty == 1 ? "ticket has" : "tickets have"} been released for ${dateInfo.artist_name} ${dateInfo.tour_name} at ${dateInfo.venue_name}, ${dateInfo.city} on ${datefns.format(new Date(dateInfo.date), "EEEE do LLLL yyyy")}`
    )

    // redirect to account page
    res.redirect(redirect)
})

router.post('/waiting-list/remove', async (req, res) => {
    await db.pool.query(`DELETE FROM waiting_list WHERE wl_id = ?`, req.body["wl-id"])

    res.redirect(req.headers.referer + "?alert=wl-removed")
})

async function refundOrder(orderID) {
    const order = await db.getOrderById(orderID)
    const seatIDs = parseArray(order.seat_ids)

    try {
        // use orderID to...
        // refund in stripe if I cba
        await stripe.refundOrder(order)

        // update in db - now doing in stripe.refundOrder
        // await db.pool.query(`UPDATE orders SET refunded = true WHERE order_id = ?`, orderID) // I should also do in Stripe but there's no real reason to.... other than a receipt

    } catch (err) {
        console.error(err)
    }


    // update status of all seats - double check the wl method
    // console.log(order.seat_ids)
    await db.pool.query(`UPDATE orders SET refunded = true WHERE order_id = ?`, orderID)
    await db.setSeatStatus("available", seatIDs)
    // from a demo standpoint, though not a live one, best if the db updates regardless of whether stripe works
}

router.get('/login', (req, res) => {
    res.render('account/login', { req, query: req.query })
})

router.post(
    '/login', 
    passport.authenticate('local', { failureRedirect: 'login', failureFlash: true, }), 
    (req, res) => {// https://stackoverflow.com/a/70171106 
        // res.redirect(req.body.redirect ?? '/account') // doesn't work anymore?
        res.redirect(!!req.body.redirect ? req.body.redirect : '/account')
    } 
)

router.get('/register', (req, res) => {
    res.render('account/register', { req, query: req.query })
})

router.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        await db.addUser(
            req.body.firstName, 
            req.body.lastName,
            req.body.email,
            hashedPassword
        )

        // could be a good place to add a stripe customer ID? or just when they reach checkout if not got one

        // redirect to login, with redirect parameters for login
        res.redirect(`login${!!req.body.redirect ? "?redirect=" + req.body.redirect : ""}`)

    } catch (err) {
        console.error(err) // need to handle the error maybe add a query string?
        if (err.code = 'ER_DUP_ENTRY') console.log("!!!", "duplicate email")
        res.redirect('register')
    }
})

router.delete('/logout', async (req, res) => {
    req.logOut((err) => {
        if (err) return err
        res.redirect('/')
    })
})
