import Stripe from "stripe"
import * as db from './database.js'
import * as datefns from 'date-fns'

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const expireAtMins = 30 // has to be at least 30 mins annoyingly

export async function createCheckoutSession(seatIDs, customerID, prevUrl) {

    let lineItems = []

    let seats = await db.getSeats(...seatIDs)

    // create a product
    // define default price data for that product
    // returns a product object
    // add default price of that product object to line items
    // for (let seat of seats) {

    // }

    // will later create a separate product called fees and make dynamic prices for them here


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
        }
    }
    prevUrl = new URL(prevUrl)
    const baseUrl = prevUrl.origin

    let cancelRedirect = prevUrl
    cancelRedirect.searchParams.set("cancelled", "true")
    cancelRedirect = cancelRedirect.toString()

    const cancelUrl = new URL(baseUrl + "/pay/cancel")
    cancelUrl.searchParams.set("cancelRedirect", cancelRedirect)
    cancelUrl.searchParams.set("seatIDs", `[${seatIDs.join(",")}]`)


    try {
        return stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: "payment",
            success_url: baseUrl + "/pay/success",
            cancel_url: cancelUrl.toString(),
            customer: customerID,
            expires_at: datefns.addSeconds(Date.now(), expireAtMins * 60), // expiry time of checkout sesh in epoch seconds
            // should work but doesn't seem to
            // metadata: {
            //     "seat_ids": [...seatIDs]
            // }
        })

        // sinc

    } catch(err) {
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