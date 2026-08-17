const express = require('express');
const router = express.Router();
const orderPaymentDetailsService = require('../../services/Order/orderPaymentDetails');

router
.post('/get',orderPaymentDetailsService.get)
.post('/create',orderPaymentDetailsService.validate(),orderPaymentDetailsService.create)
.put('/update',orderPaymentDetailsService.validate(),orderPaymentDetailsService.update)


module.exports = router;