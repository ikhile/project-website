const express = require('express');
const app = express();
const exphbs = require('express-handlebars')
const Handlebars = require('handlebars')
const port = 3000;

// https://stackabuse.com/guide-to-handlebars-templating-engine-for-node/
const { engine } = require('express-handlebars')
const fs = require("fs");

var hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs'
})
// app.engine('hbs', engine({
//     defaultLayout: 'main',
//     extname: '.hbs'
// }));
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

app.get('/', async (request, response) => {
    // https://stackoverflow.com/a/61284053
    // https://stackoverflow.com/a/26269298
    let db = await fs.promises.readFile("db.json", 'utf-8', (err, data) => data)
    db = JSON.parse(db)

    // sort by date (soonest first), then limit number of events used

    const context = {
        events: db
    }


    response.render('index', { events: db })
})

// const events = require('./routes/events.js')
app.use('/events', require('./routes/events.js'))
app.use('/search', require('./routes/search-results.js'))
app.use('/account', require('./routes/account.js'))

// app.get('/cities', (req, res) => {
//     res.render('main', {layout: 'cities'})
// })

app.listen(port, () => console.log(`App listening to port ${port}`))