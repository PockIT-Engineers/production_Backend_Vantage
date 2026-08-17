const express = require('express');
const router = express.Router();
const ticketGroupwiseDetailedReport = require('../../services/Reports/ticketGroupwiseDetailedReport');

router
    .post('/getTicketGroupwiseDetailedReport', ticketGroupwiseDetailedReport.getTicketGroupwiseDetailedReport)

module.exports = router;

