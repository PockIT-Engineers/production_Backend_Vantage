const express = require('express');
const router = express.Router();
const ticketLogDetailsService = require('../../services/Support/ticketLogDetails');

router
    .post('/get', ticketLogDetailsService.get)
    .post('/create', ticketLogDetailsService.validate(), ticketLogDetailsService.create)
    .put('/update', ticketLogDetailsService.validate(), ticketLogDetailsService.update)

module.exports = router;