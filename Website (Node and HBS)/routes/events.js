const express = require('express');
const router = express.Router();
const fs = require('fs');


router.get('/', (req, res) => {
    let context = getEventsIndexContext()
    res.render('events', context)
})

router.get('/:artist', (req, res) => {
    let artist = loadArtist(req.params.artist)

    if (!artist) {
        res.status(404).render('events-404');
        return
    }

    let context = {
        artist: artist[0].artist.label,
        tours: loadArtist(req.params.artist),
    }

    res.render('artist', context)

    $("")
})

router.get('/:artist/:tour', (req, res) => {
    let event = loadTour(req.params.artist, req.params.tour)

    if (!event) {
        res.status(404).render('events-404');
        return
    }

    let isOnsale = true // later get from onsale date in database and compare to today

    if (isOnsale) {
        let context = {
            artist: event.artist.label,
            tour: event.tour.label,
            cities: event.cities,
        }
        res.render('tour', context)
    }

    else {
        res.render('tour-before-sale')
    }    
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

module.exports = router;