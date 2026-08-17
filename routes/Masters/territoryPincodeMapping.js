const express = require('express');
const router = express.Router();
const territoryPincodeMappingService = require('../../services/Masters/territoryPincodeMapping');

router
.post('/get',territoryPincodeMappingService.get)
.post('/create',territoryPincodeMappingService.validate(),territoryPincodeMappingService.create)
.put('/update',territoryPincodeMappingService.validate(),territoryPincodeMappingService.update)
.post('/addBulk',territoryPincodeMappingService.addBulk)


module.exports = router;