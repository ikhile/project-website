import express from 'express'
import * as db from '../database.js';
import { createCheckoutSession, createStripeCustomer } from '../stripe.js';
import api from '../index.js';

export const router = express.Router();

// might move payments to a "purchase" route... could move purchase page as well yep yep
router.post('/create-checkout-session', async (req, res) => {
    // console.log("body: ", req.body)
    // console.log("params: ", req.params)

    // get customer id if exists, otherwise create new customer and pass in to 
    // console.log("!!!", req.user)
    let stripeCustomerID
    if (req.isAuthenticated()) {
        const user = await db.getUserById(req.user.user_id)
        console.log("stripe_id", user.stripe_id)

        stripeCustomerID = user.stripe_id ?? await createStripeCustomer(user)
        console.log(user.user_id, stripeCustomerID)
    }

    // should also set each ticket's status in db to "reserved" at this point

    let seatIDs = req.body.seats.replace(/\[|\]/g, "").split(",")

    let seats = await db.getSeats(...seatIDs)

    // create a product
    // define default price data for that product
    // returns a product object
    // add default price of that product object to line items
    // for (let seat of seats) {

    // }

    // console.log(await seats)

    /// OOOO OO OOO
    // I C

    // wait since I'm retrieving products here I'll just create them instead
    try {
        const session = await createCheckoutSession(seatIDs, stripeCustomerID, req.body.currentUrl)

        // set seats to reserved in database
        await db.setSeatStatus("reserved", seatIDs)

        res.redirect(303, session.url)


    } catch (err) {
        console.error(err)
        const url = new URL (req.body.currentUrl)
        url.searchParams.append("error", "true")
        res.redirect(url)
    }
    
})

router.get('/success', async (req, res) => {
    res.send("payment success")
})

router.get('/cancel', async (req, res) => {
    console.log(req.query.seatIDs)
    console.log(req.query.cancelRedirect)

    const seatIDs = req.query.seatIDs.replace(/^\[|\]$/, "").split(",").map(a => parseInt(a))

    db.setSeatStatus(null, seatIDs)

    // use query params to set seats back to available in db, then redirect to previous page

    res.redirect(req.query.cancelRedirect)
    // res.send("payment cancelled")
})