import express from 'express'
import * as db from '../database.js'
// import { createCheckoutSession, createStripeCustomer, constructWebhookEvent } from '../stripe.js'
import api, { parseArray } from '../index.js'
import Stripe from "stripe"

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)


export const router = express.Router()

router.post("/", express.raw({type: 'application/json'}), async (req, res) => {

    // https://stripe.com/docs/webhooks/quickstart?locale=en-GB&lang=node
    let event = req.body

    if (process.env.STRIPE_ENDPOINT_SECRET) {
        try {
            event = await stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_ENDPOINT_SECRET)
            return event
        } catch (err) {
            console.error(err.message)
            return res.sendStatus(400)
        }
    }

    console.log(event.type)

    if (event.data.object.object == 'checkout.session') {
        const object = event.data.object
        console.log(object.line_items)

    }

    if (event.type == 'checkout.session.expired') {
        console.log()

    }

    if (event.type == 'checkout.session.completed') {
        const { id, metadata } = event.data.object
        console.log((id, metadata.user_id, metadata.tour_id, metadata.venue_id, metadata.date_id, metadata.seat_ids, metadata))

        try {
            db.addOrder(id, metadata.user_id, metadata.tour_id, metadata.venue_id, metadata.date_id, metadata.seat_ids, JSON.stringify(metadata))

        } catch(err) {
            console.error(err)
            return res.sendStatus(400)
        }

        // const seatIDs = parseArray(metadata.seat_ids)
        await db.setSeatAvailability(false, parseArray(metadata.seat_ids))
        await db.setSeatStatus("sold", parseArray(metadata.seat_ids))
    }

    res.sendStatus(200)
})