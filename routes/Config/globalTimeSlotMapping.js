const express = require('express');
const router = express.Router();
const globalTimeSlotMappingService = require('../../services/Config/globalTimeSlotMapping');

router
.post('/get',globalTimeSlotMappingService.get)
.post('/create',globalTimeSlotMappingService.validate(),globalTimeSlotMappingService.create)
.put('/update',globalTimeSlotMappingService.validate(),globalTimeSlotMappingService.update)


module.exports = router;