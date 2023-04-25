import express from 'express'
import Handlebars from 'handlebars'
import * as exphbs from 'express-handlebars'
import * as db from './database.js';
import { router as eventsRouter } from './routes/events.js'
import * as datefns from 'date-fns'

const app = express();
const port = 3000;

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
    extname: '.hbs'
})

app.engine(hbs.extname, hbs.engine)
app.set('view engine', hbs.extname)
app.set('views', './views')
app.use(express.static('public'))

Handlebars.registerHelper('replaceSymbols', function(str){
    let chars = [
        {
            key: "&#x3d;",
            char: "="
        }
    ]

    for (let char of chars) {
        str = str.replace(char.key, char.char)
    }

    return str
})

Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase()
})

Handlebars.registerHelper('formatDate', function(date, format) {
    const defaultFormat = "do LLL"    
    let args = Array.from(arguments); args.pop()

    return datefns.format(
        new Date(date), 
        args.length == 1 ? defaultFormat : format
    )
});

// JS Bin figuring the below out: https://jsbin.com/zoquloleyu/1/edit?js,console

export function groupDates(dates) {
    let grouped = {}

    
    for (let date of dates) {

        let d = new Date(date.hasOwnProperty("date") ? date.date : date)
      
        let year = datefns.format(d, 'yyyy'), month = datefns.format(d, 'LLLL')
        
        if (!grouped.hasOwnProperty(year)) {
            grouped[year] = {}
        }
        
        if (!grouped[year].hasOwnProperty(month)) {
            grouped[year][month] = []
        }
        
        grouped[year][month].push(date)
        
    }        
    return groupedDatesToArray(grouped)
    
}

function groupedDatesToArray(groupedDates) {
    let arr = []
      for (let year of Object.keys(groupedDates)) {
        for (let month of Object.keys(groupedDates[year])) {
          arr.push(groupedDates[year][month])
        }
      }
    
    return arr
  }

Handlebars.registerHelper('groupDates', (dates) => {
    return groupDates(dates)
})

Handlebars.registerHelper('venueDatesToDatesArray', function(venueDates) {
    return venueDates.map(a => a.date)
})

Handlebars.registerHelper('addVenueIDToUrl', function(url, venue_id) {
    console.log(url)
    return url.replace('[VENUE_ID]', venue_id)
})

app.get('/', async (req, res) => {
    
    const context = {
        events: await db.getAllEvents() // need to sort by date (soonest first), then limit number of events used
    }

    res.render('index', context)
})

app.use('/events', eventsRouter)

// app.use('/search', require('./routes/search-results.js'))
// app.use('/account', require('./routes/account.js'))

// app.get('/cities', (req, res) => {
//     res.render('main', {layout: 'cities'})
// })

app.listen(port, () => console.log(`App listening to port ${port}`))