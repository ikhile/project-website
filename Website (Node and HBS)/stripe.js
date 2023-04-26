import Stripe from "stripe"
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

export async function createCheckoutSession() {
    let productIDs = ["prod_Nmi1R3RRdP2r5l"]
    let products = []

    for (let id of productIDs) {
        const product = await stripe.products.retrieve(id)
        products.push({
            price: product.default_price,
            quanity: 1
        })
    }

    console.log(products)

    return stripe.checkout.sessions.create({
        line_items: [
            {
                price: 'price_1N18bRJuWbWNbD9CJfa9UKB3',
                quantity: 1
            }
        ],
        mode: "payment",
        success_url: "http://localhost:3000/events/payment-success",
        cancel_url: "http://localhost:3000/events/payment-cancel"
    })
}