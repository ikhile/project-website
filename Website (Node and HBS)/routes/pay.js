import express from 'express'
import * as db from '../database.js';
import { createCheckoutSession } from '../stripe.js';
import api from '../index.js';

export const router = express.Router();

// might move payments to a "purchase" route... could move purchase page as well yep yep
router.post('/create-checkout-session', async (req, res) => {
    console.log("body: ", req.body)
    console.log("params: ", req.params)

    // should also set each ticket's status in db to "reserved" at this point

    let seatIDs = req.body.seats.replace(/\[|\]/g, "").split(",")

    let seats = await db.getSeats(...seatIDs)

    // create a product
    // define default price data for that product
    // returns a product object
    // add default price of that product object to line items
    for (let seat of seats) {

    }

    console.log(await seats)

    /// OOOO OO OOO
    // I C


    // wait since I'm retrieving products here I'll just create them instead
    const session = await createCheckoutSession(seatIDs, true)

    // console.log(session)

    // res.redirect(303, session.url)
})

router.get('/success', async (req, res) => {
    res.send("payment success")
})

router.get('/cancel', async (req, res) => {
    res.send("payment cancelled")
})