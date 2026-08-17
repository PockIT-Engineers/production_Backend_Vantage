const express = require('express');
const router = express.Router();
const couponTransactionService = require('../../services/Reports/coupon');

router
    .post('/detailed/get', couponTransactionService.getDetailedReport)
    .post('/summary/get', couponTransactionService.getSummaryReport)

module.exports = router;