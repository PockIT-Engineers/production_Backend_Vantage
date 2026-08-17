const express = require('express');
const router = express.Router();
const countryCurrencyMappingService = require('../../services/Masters/countryCurrencyMapping');

router
.post('/get',countryCurrencyMappingService.get)
.post('/create',countryCurrencyMappingService.validate(),countryCurrencyMappingService.create)
.put('/update',countryCurrencyMappingService.validate(),countryCurrencyMappingService.update)
.post('/addBulk',countryCurrencyMappingService.addBulk)


module.exports = router;