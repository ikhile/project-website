import Stripe from "stripe"
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

export async function createCheckoutSession(reqBody) {

    let lineItems = []

    for (let id of reqBody["product-ids"].split(",")) {
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

    // console.log(products)

    return stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: "payment",
        success_url: "http://localhost:3000/events/payment-success",
        cancel_url: "http://localhost:3000/events/payment-cancel"
    })
}