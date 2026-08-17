const express = require('express');
const router = express.Router();
const couponTransactionsService = require('../../services/Order/coupontransactions');

router
.post('/get',couponTransactionsService.get)
.post('/create',couponTransactionsService.validate(),couponTransactionsService.create)
.put('/update',couponTransactionsService.validate(),couponTransactionsService.update)


module.exports = router;