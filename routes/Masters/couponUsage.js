const express = require('express');
const router = express.Router();
const couponUsageService = require('../../services/Masters/couponUsage');

router
.post('/get',couponUsageService.get)
.post('/create',couponUsageService.validate(),couponUsageService.create)
.put('/update',couponUsageService.validate(),couponUsageService.update)


module.exports = router;