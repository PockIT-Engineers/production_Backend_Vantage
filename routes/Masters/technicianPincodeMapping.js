const express = require('express');
const router = express.Router();
const technicianPincodeMappingService = require('../../services/Masters/technicianPincodeMapping');

router
.post('/get',technicianPincodeMappingService.get)
.post('/create',technicianPincodeMappingService.validate(),technicianPincodeMappingService.create)
.put('/update',technicianPincodeMappingService.validate(),technicianPincodeMappingService.update)
.post('/addBulk',technicianPincodeMappingService.addBulk)


module.exports = router;