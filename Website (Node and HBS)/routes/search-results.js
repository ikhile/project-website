const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('search-results', {
        query: req.query.query
    })
})

module.exports = router