const express = require('express');
const router = express.Router();
const shopOrderSummaryDetailsService = require('../../services/ShipModule/shopOrderSummaryDetails');

router
    .post('/get', shopOrderSummaryDetailsService.getAll)
    .get('/:id', shopOrderSummaryDetailsService.get)
    .post('/create', shopOrderSummaryDetailsService.validate(), shopOrderSummaryDetailsService.create)
    .put('/update', shopOrderSummaryDetailsService.validate(), shopOrderSummaryDetailsService.update)


module.exports = router;