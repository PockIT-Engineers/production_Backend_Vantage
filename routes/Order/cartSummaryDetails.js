const express = require('express');
const router = express.Router();
const cartSummaryDetailsService = require('../../services/Order/cartSummaryDetails');

router
    .post('/get', cartSummaryDetailsService.get)
    .post('/create', cartSummaryDetailsService.validate(), cartSummaryDetailsService.create)
    .put('/update', cartSummaryDetailsService.validate(), cartSummaryDetailsService.update)


module.exports = router;