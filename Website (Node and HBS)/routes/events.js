const express = require('express');
const router = express.Router();
const fs = require('fs');


router.get('/', (req, res) => {
    let context = getEventsIndexContext()
    res.render('events', context)
})

router.route(['/test-1', '/test-2']).get((req, res) => {
    res.send("multiple routes test")
})

router.get('/:artist', (req, res) => {
    let artist = loadArtist(req.params.artist)

    if (!artist) {
        res.status(404).render('events/404');
        return
    }

    let context = {
        artist: artist[0].artist.label,
        tours: loadArtist(req.params.artist),
    }

    res.render('events/artist', context)
})

router.get('/:artist/:tour', (req, res) => {
    let event = loadTour(req.params.artist, req.params.tour)
    console.log(req.originalUrl)

    if (!event) {
        res.status(404).render('events-404');
        return
    }

    let isOnsale = true // later get from onsale date in database and compare to today

    if (isOnsale) {
        let context = {
            originalUrl: req.originalUrl,
            artist: event.artist.label,
            tour: event.tour.label,
            cities: event.cities,
        }
        res.render('events/artist/tour', context)
    }

    else {
        res.render('tour-before-sale')
    }    
})

router.get('/:artist/:tour/purchase', (req, res) => {
    let event = loadTour(req.params.artist, req.params.tour)
    console.log(req.originalUrl)

    if (!event) {
        res.status(404).render('events-404');
        return
    }

    let isOnsale = true // later get from onsale date in database and compare to today

    if (isOnsale) {
        let context = {
            originalUrl: req.originalUrl,
            artist: event.artist.label,
            tour: event.tour.label,
            cities: event.cities,
        }
        res.render('events/artist/tour/purchase', context)
    }

    else {
        res.render('events/artist/tour/purchase/before-sale.hbs')
    }   
})

// e.g. events/beyonce/renaissance/sign-up OR events/beyonce/renaissance/purchase/sign-up
router.route(['/:artist/:tour/sign-up', '/:artist/:tour/purchase/sign-up']).get((req, res) => {
    let city = req.query.city // can use to autofill city on sign up form
    res.send(`Sign up for tickets for ${req.params.artist} ${req.params.tour} at ${req.params.city}`)
})

router.get('/:artist/:tour/purchase/:city', (req, res, next) => {
    let city = loadCity(req.params.artist, req.params.tour, req.params.city)
    if (!city) { res.status(404).render('events-404'); return }

    isOnsale = true // later get from onsale date in database and compare to today
    if (!isOnsale) { 
        // refactored for clarity
        // res.redirect(req.originalUrl.replace(req.params.city, "sign-up") + `?city=${req.params.city}`) 

        let newUrl = req.originalUrl.replace(req.params.city, "sign-up")
        let cityQuery = `?city=${req.params.city}`
        res.redirect(newUrl + cityQuery)
    }

    let context = {
        city: city.city,
        data: city
    }

    res.render('events/artist/tour/purchase/city', context)

})

router.get('/:artist/:tour/purchase/:city/queue', (req, res) => {

    res.send(`You are in the queue for tickets to ${req.params}`)
    // res.render('events/artist/tour/purchase/queue', context)

})



let db
fs.readFile("./db.json", function (err, data){
    db = JSON.parse(data)
    // console.log("json" + JSON.stringify(db))
})

let db2 = [
    {
        artist: {
            key: "beyonce",
            label: "Beyoncé"
        },
        tour: {
            key: "renaissance",
            label: "Renaissance World Tour"
        },
        cities: [
            {
                city: "London",
                dates: [
                    "2023-05-29",
                    "2023-05-30",
                    "2023-06-01",
                    "2024-02-15",
                    "2021-02-15",
                    "2023-06-03",
                    "2023-06-04"
                ]
            },
            {
                city: "Edinburgh",
                dates: [
                    "2023-05-23"
                ]
            }
        ]
    }
]

function getEventsIndexContext() {
    let context = {
        events: []
    }

    db.forEach(a => {
        context.events.push({
            artist: a.artist,
            tour: a.tour
        })
    })

    // context.sort(/*sort by tour start date*/)

    return context
}

function loadArtist(artistKey) {
    let artist = db.filter(a => a.artist.key === artistKey)
    if (artist.length === 0) return null
    else return artist
}

function loadTour(artistKey, tourKey) {
    return db.find(a => a.artist.key === artistKey && a.tour.key === tourKey)
}

function loadCity(artistKey, tourKey, city) {
    let tour = loadTour(artistKey, tourKey)
    let c = tour?.cities.find(a => a.city.toUpperCase() == city.toUpperCase())
    console.log(c)
    return c
}

function send404() {
    
}

module.exports = router;