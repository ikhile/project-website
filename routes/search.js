import express from 'express'
export const router = express.Router()
import * as db from '../database.js'

router.get('/', async (req, res) => {
    const context = {
        req,
        query: req.query.query,
        results: await db.search(req.query.query)
    }

    res.render('search', context)
})