const express = require('express');
const router = express.Router();
const ticketFaqMappingService = require('../../services/Support/ticketFaqMapping');

router
    .post('/get', ticketFaqMappingService.get)
    .post('/addBulk', ticketFaqMappingService.addBulk)
    .post('/getTicketFaqMapping', ticketFaqMappingService.getTicketFaqMappings)

module.exports = router;