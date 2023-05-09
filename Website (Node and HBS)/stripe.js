import Stripe from "stripe"
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

export async function createCheckoutSession(seatIDs, createNewProducts = true) {

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
            // if (createNewProducts) {


            // } else {
            //     const product = await stripe.products.retrieve(id)
            // }

            // allows images - if I get images for appearance I can include some for product pages
            // const product = await stripe.products.create(
            //     name: `1x Ticket for ${seat.artist_name} ${seat.tour_name} at ${seat.venue_name} ${seat.city_name}`
            // )

            lineItems.push({
                price: product.default_price,
                quantity: 1
            })
        } catch (err) {
            console.error(err)
        }
        
        
    }

    console.log("need to put seat ids into stripe as products; currently, the below won't work as no products were retrieved above")

    // try {
    //     return stripe.checkout.sessions.create({
    //         line_items: lineItems,
    //         mode: "payment",
    //         success_url: "http://localhost:3000/pay/success",
    //         cancel_url: "http://localhost:3000/pay/cancel"
    //     })

    // } catch(err) {
    //     console.error(err)
    // }

}