const express = require('express');
const router = express.Router();
const shoporderCancellationTransactionsService = require('../../services/ShipModule/shopOrdercancellationtransactions');

router
    .post('/get', shoporderCancellationTransactionsService.get)
    .post('/getCounts', shoporderCancellationTransactionsService.getCounts)
    .post('/create', shoporderCancellationTransactionsService.validate(), shoporderCancellationTransactionsService.create)
    .put('/update', shoporderCancellationTransactionsService.validate(), shoporderCancellationTransactionsService.update)
    .post('/updateStatus', shoporderCancellationTransactionsService.updateStatus)
    .post('/RefundStatus', shoporderCancellationTransactionsService.RefundStatus)


module.exports = router;