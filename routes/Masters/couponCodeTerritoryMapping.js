const express = require('express');
const router = express.Router();
const couponCodeTerritoryMappingService = require('../../services/Masters/couponCodeTerritoryMapping');

router
.post('/get',couponCodeTerritoryMappingService.get)
.post('/create',couponCodeTerritoryMappingService.validate(),couponCodeTerritoryMappingService.create)
.put('/update',couponCodeTerritoryMappingService.validate(),couponCodeTerritoryMappingService.update)


module.exports = router;