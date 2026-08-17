const express = require('express');
const router = express.Router();
const vendorServiceCostMappingService = require('../../services/Masters/vendorServiceCostMapping');

router
.post('/get',vendorServiceCostMappingService.get)
.post('/create',vendorServiceCostMappingService.validate(),vendorServiceCostMappingService.create)
.put('/update',vendorServiceCostMappingService.validate(),vendorServiceCostMappingService.update)
.post('/addBulk',vendorServiceCostMappingService.addBulk)


module.exports = router;