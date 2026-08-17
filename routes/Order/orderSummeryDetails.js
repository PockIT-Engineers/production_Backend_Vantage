    const express = require('express');
const router = express.Router();
const orderSummeryDetailsService = require('../../services/Order/orderSummeryDetails');

router
.post('/get',orderSummeryDetailsService.get)
.post('/create',orderSummeryDetailsService.validate(),orderSummeryDetailsService.create)
.put('/update',orderSummeryDetailsService.validate(),orderSummeryDetailsService.update)


module.exports = router;