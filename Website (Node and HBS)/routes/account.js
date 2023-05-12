import express from 'express'
export const router = express.Router();
import * as bcrypt from 'bcrypt'
import passport from 'passport'
import * as pconfig from '../passport-config.js'
import * as flash from 'express-flash'
import * as session from 'express-session'
import * as db from '../database.js'

pconfig.passportInit(
    passport, 
    // email => await db.getUserByEmail(email),
    // id => await db.getUserById(id)
)

const users = [
    {
        id: 0,
        name: "Test",
        email: "test@test",
        password: await (bcrypt.hash("test", 10))
    }
]

router.get('/', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/account/login')

    res.render('account/account')

})

router.get('/login', (req, res) => {
    
    res.render('account/login', { query: req.query })
})

let successRedirect = '/account'

router.post('/login', loginRedirect, passport.authenticate('local', {
    // successRedirect: successRedirect,
    failureRedirect: 'login',
    failureFlash: true,
}), (req, res) => {
    console.log("sanity check")
})

function loginRedirect(req, res, next) {
    console.log("!!!", req.query, req.body)
    console.log(!!req.body.redirect)

    // req.vars.successRedirect = !!req.body.redirect ? 
    // successRedirect = "null"


    if (!!req.body.redirect) {
        if (req.body.redirect == "purchase")
        successRedirect = `/events/purchase/tour/${req.body.tour}`
    }

    console.log(successRedirect)

    next()
}

router.get('/register', (req, res) => {
    res.render('account/register')
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

        res.redirect('login')

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
