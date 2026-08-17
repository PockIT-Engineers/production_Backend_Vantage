const express = require('express');
const router = express.Router();
const orderRefundTransactionsService = require('../../services/Order/orderrefundtransactions');

router
.post('/get',orderRefundTransactionsService.get)
.post('/create',orderRefundTransactionsService.validate(),orderRefundTransactionsService.create)
.put('/update',orderRefundTransactionsService.validate(),orderRefundTransactionsService.update)


module.exports = router;