import express from 'express'
import fs from 'fs'
import * as db from '../database.js';

export const router = express.Router();

router.get("/tours", async (req, res) => {
    res.json(await db.getAllEvents())
})

router.get("/tours/:tour_id", async (req, res) => {
    return res.json(await db.getEventById(req.params.tour_id))
})

router.get("/artists", async (req, res) => {
    res.json(await db.getAllArtists())
})

// router.get("/artists/:artist_id")

router.get("/tours/:tour_id/venues", async (req, res) => {
    res.json(await db.getTourDatesGroupedByVenue(req.params.tour_id))
})


