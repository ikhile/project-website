import express from 'express'
export const router = express.Router();
import * as bcrypt from 'bcrypt'
import passport from 'passport'
import * as pconfig from '../passport-config.js'
import * as flash from 'express-flash'
import * as session from 'express-session'

pconfig.passportInit(
    passport, 
    email => users.find(user => user.email == email),
    id => users.find(user => user.id == id)
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
    res.render('account/account')
})

router.get('/login', (req, res) => {
    res.render('account/login')
})

router.post('/login', passport.authenticate('local', {
    successRedirect: '/account',
    failureRedirect: 'login',
    failureFlash: true,
}))

router.get('/register', (req, res) => {
    res.render('account/register')
})

router.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        users.push({
            id: users.length(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })

        res.redirect('login')

    } catch (err) {
        res.redirect('register')
    }
})

router.delete('/logout', async (req, res) => {
    req.logOut((err) => {
        if (err) return err
        res.redirect('/')
    })
})
