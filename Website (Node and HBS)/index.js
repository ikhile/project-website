const express = require('express');
const app = express();
const port = 3000;

// doesn't work: from
// const handlebars = require('express-handlebars')
// app.set('view engine', 'handlebars')
// app.engine('handlebars', handlebars({
//     layoutsDir: __dirname + '/views/layouts'
// }))

// works: from https://stackoverflow.com/a/69962894 > https://www.npmjs.com/package/express-handlebars
// const { engine } = require('express-handlebars')
// app.engine('handlebars', engine({
//     defaultLayout: 'main',
//
// }))

// https://stackabuse.com/guide-to-handlebars-templating-engine-for-node/
const { engine } = require('express-handlebars')
const fs = require("fs");
app.engine('hbs', engine({
    defaultLayout: 'main',
    extname: '.hbs'
}));
app.set('view engine', 'hbs')
app.set('views', './views')


app.use(express.static('public'))

// const fsPromises = fs

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