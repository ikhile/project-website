import Stripe from "stripe"
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

export async function createCheckoutSession(seatIDs) {

    let lineItems = []

    for (let id of seatIDs) {
        try {
            const product = await stripe.products.retrieve(id)

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