const express = require('express');
const router = express.Router();
const couponCodeServiceMappingService = require('../../services/Masters/couponCodeServiceMapping');

router
.post('/get',couponCodeServiceMappingService.get)
.post('/create',couponCodeServiceMappingService.validate(),couponCodeServiceMappingService.create)
.put('/update',couponCodeServiceMappingService.validate(),couponCodeServiceMappingService.update)


module.exports = router;