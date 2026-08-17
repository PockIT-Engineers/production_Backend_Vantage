const express = require('express');
const router = express.Router();
const ticketGroupwiseSummaryReport = require('../../services/Reports/ticketGroupwiseSummaryReport');

router
    .post('/getTicketGroupwiseSummaryReport', ticketGroupwiseSummaryReport.getTicketGroupwiseSummaryReport)

module.exports = router;

