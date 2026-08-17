const express = require('express');
const router = express.Router();
const couponCodeCountryMappingService = require('../../services/Masters/couponCodeCountryMapping');

router
.post('/get',couponCodeCountryMappingService.get)
.post('/create',couponCodeCountryMappingService.validate(),couponCodeCountryMappingService.create)
.put('/update',couponCodeCountryMappingService.validate(),couponCodeCountryMappingService.update)


module.exports = router;