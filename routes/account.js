import express from 'express'
import passport from 'passport'
import * as bcrypt from 'bcrypt'
import * as pconfig from '../passport-config.js'
import * as flash from 'express-flash'
import * as session from 'express-session'
import * as db from '../database.js'

export const router = express.Router()

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

router.post(
    '/login', 
    passport.authenticate('local', { failureRedirect: 'login', failureFlash: true, }), 
    (req, res) => res.redirect(req.body.redirect ?? '/account') // https://stackoverflow.com/a/70171106 
)

router.get('/register', (req, res) => {
    res.render('account/register', {query: req.query})
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

        // redirect to login, with redirect parameters for login
        res.redirect(`login${!!req.body.redirect ? "?redirect=" + req.body.redirect : ""}`)

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
