const express = require('express');
const router = express.Router();
const ticketSupportAgentwiseDetailedReport = require('../../services/Reports/ticketSupportAgentwiseDetailedReport');

router
    .post('/getTicketSupportAgentwiseDetailedReport', ticketSupportAgentwiseDetailedReport.getTicketSupportAgentwiseDetailedReport)

module.exports = router;

