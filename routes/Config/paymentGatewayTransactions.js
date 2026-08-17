const express = require('express');
const router = express.Router();
const paymentGatewayTransactionsService = require('../../services/Config/paymentGatewayTransactions.js');

router
    .post('/get', paymentGatewayTransactionsService.get)
    .post('/create', paymentGatewayTransactionsService.validate(), paymentGatewayTransactionsService.create)
    .put('/update', paymentGatewayTransactionsService.validate(), paymentGatewayTransactionsService.update)
    .post('/createOrder', paymentGatewayTransactionsService.createOrder)

module.exports = router;