const express = require('express');
const router = express.Router();
const globalTimeSlotConfigService = require('../../services/Config/globalTimeSlotConfig');

router
.post('/get',globalTimeSlotConfigService.get)
.post('/create',globalTimeSlotConfigService.validate(),globalTimeSlotConfigService.create)
.put('/update',globalTimeSlotConfigService.validate(),globalTimeSlotConfigService.update)


module.exports = router;