const express = require('express');
const router = express.Router();
const groupwiseTicketClosingTime = require('../../services/Reports/ticketResolutionTimeGroupwise');

router
    .post('/getTicketResolutionTimeGroupwise', groupwiseTicketClosingTime.getTicketResolutionTimeGroupwise)

module.exports = router;

