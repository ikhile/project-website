import Stripe from "stripe"
import * as db from './database.js'
import * as datefns from 'date-fns'
import { stringifyArray } from "./index.js"
import dotenv from 'dotenv'
dotenv.config()

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const expireAfterMins = 30 // has to be at least 30 mins annoyingly

export async function createCheckoutSession(seatIDs, customerID, req) {
    let lineItems = []
    let seats = await db.getSeats(...seatIDs)
    const fee = {price: "price_1N9qREJuWbWNbD9CCnh2faVJ", quantity: 1}

    for (let seat of seats) {
        try {
            let productDescription = `1 Ticket for ${seat.artist_name} ${seat.tour_name}\n\n${datefns.format(new Date(seat.date), 'EEEE do LLLL yyyy')}\n${seat.venue_name} ${seat.city}\n\n`

            if (!!seat.general_admission) {
                productDescription += `General Admission ${seat.section}`
            } else {
                productDescription += `Section ${seat.section} Block ${seat.block}\nRow ${seat.row_name} Seat ${seat.seat_number}`
            }

            const product = await stripe.products.create({
                name: `1x Ticket for ${seat.tour_name}, ${seat.date} at ${seat.venue_name} ${seat.city}`,
                description: productDescription,
                default_price_data: {
                    currency: "gbp",
                    unit_amount: seat.price * 100
                },
                metadata: {...seat},
            })

            lineItems.push({
                price: product.default_price,
                quantity: 1
            })
        } catch (err) {
            console.error(err)
            throw new Error(err) // might get rid - for now this will alert me if anything goes wrong here
        }
    }

    lineItems.push(fee) // add booking fee as last item in list

    const cancelUrl = new URL(req.headers.referer)
    cancelUrl.searchParams.set("cancelled", "true")

    let successUrl = new URL(req.headers.origin + "/events/purchase/success")
    successUrl += (!!successUrl.search ? "&" : "?") + "session={CHECKOUT_SESSION_ID}"

    try {
        return stripe.checkout.sessions.create({
            mode: "payment",
            line_items: lineItems,
            success_url: successUrl,
            cancel_url: cancelUrl.toString(),
            customer: customerID,
            expires_at: datefns.addSeconds(Date.now(), expireAfterMins * 60), // expiry time of checkout sesh in epoch seconds
            metadata: {
                user_id: req.user.user_id,
                tour_id: req.body.tourID,
                venue_id: req.body.venueID,
                date_id: req.body.date,
                seat_ids: stringifyArray(seatIDs)
            }
        })

    } catch(err) {
        console.error(err)
    }

}

export async function retrieveStripeSession(sessionID) {
    try {
        return await  stripe.checkout.sessions.retrieve(sessionID)
        
    } catch (err) {
        console.error(err)
    }
}

export async function createStripeCustomer(user) {

    try {
        const customer = await stripe.customers.create({
            name: `${user.first_name} ${user.last_name}`,
            email: user.email
        })

        await db.updateStripeID(user.user_id, await customer.id)
        return customer.id
    } catch (err) {
        console.error(err)
    }
}

export async function constructWebhookEvent(body, signature) {
    try {
        const event = await stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_ENDPOINT_SECRET)
        return event
    } catch (err) {
        console.error(err)
        throw new Error(err.message)
        // return false
    }
}

export async function refundOrder(order) {
    const { payment_intent: intentID } = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
    const { latest_charge: chargeID } = await stripe.paymentIntents.retrieve(intentID)
    const { id: refundID } = await stripe.refunds.create({charge: chargeID})

    try {
        await db.pool.query(`
        UPDATE orders 
        SET 
            refunded = true,
            stripe_refund_id = ?            
        WHERE order_id = ?`
        , [refundID, order.order_id]
    )
    } catch (err) {
        console.error(err)
    }
}
