const express = require('express');
const router = express.Router();
const siteVisitReportService = require('../../services/Masters/siteVisitReport.js');

router
    .post('/get', siteVisitReportService.get)
    .post('/create', siteVisitReportService.validate(), siteVisitReportService.create)
    .put('/update', siteVisitReportService.validate(), siteVisitReportService.update)


module.exports = router;