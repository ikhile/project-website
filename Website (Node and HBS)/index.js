import express from 'express'
import Handlebars from 'handlebars'
import * as exphbs from 'express-handlebars'
import * as db from './database.js';
import { router as eventsRouter } from './routes/events.js'
import { router as apiRouter } from './routes/api.js'
import * as datefns from 'date-fns'
import * as helpers from './helpers.js'
import bodyParser from 'body-parser' // https://stackoverflow.com/a/27855234
import axios from 'axios';

const app = express();
const port = 3000;

const api = axios.create({
    baseURL: 'http://localhost:3000/api/'
})

export default api

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

function mapHelpers() {
    let helpersObj = {}
    for (let helper of Object.keys(helpers)) { // use of Object.keys here: https://stackoverflow.com/a/71132743
        helpersObj[helper] = helpers[helper]
    }
    return helpersObj
}

app.get('/', async (req, res) => {
    
    const context = {
        events: await db.getAllEvents() // need to sort by date (soonest first), then limit number of events used
    }

    res.render('index', context)
})

app.use('/events', eventsRouter)
app.use('/api', apiRouter)

// app.use('/search', require('./routes/search-results.js'))
// app.use('/account', require('./routes/account.js'))

// app.get('/cities', (req, res) => {
//     res.render('main', {layout: 'cities'})
// })

app.listen(port, () => console.log(`App listening to port ${port}`))