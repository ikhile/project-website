import express from 'express'
export const router = express.Router()
import * as db from '../database.js'
import { stringifyLog } from './events.js'

router.get('/', async (req, res) => {
    const context = {
        query: req.query.query,
        results: await db.search(req.query.query)
    }

    res.render('search', context)
})