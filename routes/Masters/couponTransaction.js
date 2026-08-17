const express = require('express');
const router = express.Router();
const couponTransactionService = require('../../services/Masters/couponTransaction');

router
.post('/get',couponTransactionService.get)
.post('/create',couponTransactionService.validate(),couponTransactionService.create)
.put('/update',couponTransactionService.validate(),couponTransactionService.update)


module.exports = router;