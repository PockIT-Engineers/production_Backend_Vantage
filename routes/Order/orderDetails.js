const express = require('express');
const router = express.Router();
const orderDetailsService = require('../../services/Order/orderDetails');

router
.post('/get',orderDetailsService.get)
.post('/create',orderDetailsService.validate(),orderDetailsService.create)
.put('/update',orderDetailsService.validate(),orderDetailsService.update)
.post('/getOrderDetails',orderDetailsService.getOrderDetails)


module.exports = router;