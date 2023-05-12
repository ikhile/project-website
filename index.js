import express from 'express'
import Handlebars from 'handlebars'
import * as exphbs from 'express-handlebars'
import * as db from './database.js';
import { router as eventsRouter } from './routes/events.js'
import { router as apiRouter } from './routes/api.js'
import { router as accountRouter } from './routes/account.js'
import { router as payRouter } from './routes/pay.js'
import { router as searchRouter } from './routes/search.js'
import { router as webhooksRouter } from './routes/webhooks.js'
import * as datefns from 'date-fns'
import * as helpers from './helpers.js'
import bodyParser from 'body-parser' // https://stackoverflow.com/a/27855234
import axios from 'axios';
import flash from 'express-flash'
import session from 'express-session'
import passport from 'passport'
import methodOverride from 'method-override'

const app = express();
const port = 3000;

const api = axios.create({
    baseURL: 'http://localhost:3000/api/'
})

export default api

export async function getApiData(path) {
    let data, res = await api.get(path).then((res) => data = res.data)
}



// just figuring out how to make my own modules lol
// const um = require('./queue')
// um()
// having the above lets me use um() AND runs the lile queueing interval
// but if I don't want um then just
// require('./queue')
// also works

// https://stackabuse.com/guide-to-handlebars-templating-engine-for-node/
// const { engine } = require('express-handlebars')
// const fs = require("fs");

var hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: mapHelpers()
})

app.engine(hbs.extname, hbs.engine)
app.set('view engine', hbs.extname)
app.set('views', './views')
app.use(express.static('public'))

// https://stackoverflow.com/a/27855234
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// https://www.youtube.com/watch?v=-RCnNyD0L-s
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.use((req, res, next) => {
    app.locals.req = req
    app.locals.title = "Tickets"
    // app.locals.isAuthenticated = !!req.user
    // console.log("isauth " + !!req.user, req.isAuthenticated())
    // if (!!req.user) app.locals.user = req.user
    next()
})

// function checkAuthenticated(req, res, next) {

// }

function mapHelpers() {
    let helpersObj = {}
    for (let helper of Object.keys(helpers)) { // use of Object.keys here: https://stackoverflow.com/a/71132743
        helpersObj[helper] = helpers[helper]
    }
    return helpersObj
}

app.get('/', async (req, res) => {
    let events = await db.getAllEvents(10)

    for (let event of events) {
        event.firstDate = await api.get(`tours/${event.tour_id}/dates/first`).then((res) => res.data)
        event.lastDate = await api.get(`tours/${event.tour_id}/dates/last`).then((res) => res.data)
        event.purchaseSlots = await db.getPurchaseSlots(event.tour_id)
        event.salesStart = await db.tourSalesStart(event.tour_id)
    }

    const context = {
        events: events
    } 

    res.render('index', context)
})

app.use('/account', accountRouter)
app.use('/events', eventsRouter)
app.use('/api', apiRouter)
app.use('/pay', payRouter)
app.use('/search', searchRouter)
app.use('/webhooks', webhooksRouter)

// app.use('/search', require('./routes/search-results.js'))
// app.use('/account', require('./routes/account.js'))

// app.get('/cities', (req, res) => {
//     res.render('main', {layout: 'cities'})
// })

app.listen(port, () => console.log(`App listening to port ${port}`))