import express from 'express'
import passport from 'passport'
import * as bcrypt from 'bcrypt'
import * as pconfig from '../passport-config.js'
import * as flash from 'express-flash'
import * as session from 'express-session'
import * as db from '../database.js'
import { checkAuthRedirect, parseArray } from '../index.js'
import { stringifyLog } from './events.js'
import * as wl from '../waiting-list.js'

export const router = express.Router()

pconfig.passportInit(passport)

router.get('/', checkAuthRedirect, async (req, res) => {
    const context = {
        req,
        orders: await db.getUserOrders(req.user.user_id), // gonna want some joins - tour name, artist name, venue and city, date
        // then for each seat, parse the array then get each seat from db as well
        wlError: req.query.hasOwnProperty("wl-error"),
        wlSuccess: req.query.hasOwnProperty("wl-success")
    }

    for (let order of context.orders) {
        // console.log(order.seat_ids)
        // order.seat_ids = order.seat_ids.replace(/\\|\"/, "")
        // order.seat_ids = [...JSON.parse(JSON.parse(order.seat_ids))] // needs to be doubled parsed for whatever reason
        // order.seat_ids = parseArray(order.seat_ids)
        const seat_ids = parseArray(order.seat_ids)
        order.seats = await db.getSeats(...seat_ids) // WHY did i use the spread operator here *melt emoji*
    }

    // stringifyLog(context.orders)

    res.render('account/account', context)

})

router.post('/put-on-waiting-list', async (req, res) => {
    console.log(req.body)

    try {
        wl.releaseTickets(req.body.date_id, req.body.seat_ids, req.body.order_id)
        res.redirect('/account?wl-success')
    } catch (err) {
        console.error(err)
        res.redirect('/account?wl-error')
    }
})

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
