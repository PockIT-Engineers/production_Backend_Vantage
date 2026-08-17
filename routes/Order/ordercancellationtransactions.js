const express = require('express');
const router = express.Router();
const orderCancellationTransactionsService = require('../../services/Order/ordercancellationtransactions');

router
    .post('/get', orderCancellationTransactionsService.get)
    .post('/getCounts', orderCancellationTransactionsService.getCounts)
    .post('/create', orderCancellationTransactionsService.validate(), orderCancellationTransactionsService.create)
    .put('/update', orderCancellationTransactionsService.validate(), orderCancellationTransactionsService.update)
    .post('/updateStatus', orderCancellationTransactionsService.updateStatus)
    .post('/RefundStatus', orderCancellationTransactionsService.RefundStatus)


module.exports = router;