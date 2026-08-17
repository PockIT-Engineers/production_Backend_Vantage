const express = require('express');
const router = express.Router();
const ReportService = require('../../services/Reports/inventoryReports');
const inventoryRequestService = require('../../services/Inventory/inventoryRequest');

router
    .post('/getStockMgtReport', ReportService.getStockMgtReport)
    .post('/getTechniciansStockMgtReport', ReportService.getTechniciansStockMgtReport)
    .post('/getTechniciansPartRequest', inventoryRequestService.get)
    .post('/getTechniciansPartRequestDetails', ReportService.getPartDetails)
    .post('/getStocksbyCategory', ReportService.getStocksbyCategory)
    .post('/getStocksbyUnit', ReportService.getStocksbyUnit)
    .post('/getStocksForUnit', ReportService.getStocksForUnit)
    .post('/getStocksForWeb', ReportService.getStocksforWeb)

module.exports = router;