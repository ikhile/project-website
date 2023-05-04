import express from 'express'
export const router = express.Router();

router.get('/', (req, res) => {
    res.render('search', {
        query: req.query.query
    })
})