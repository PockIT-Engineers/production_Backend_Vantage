const express = require('express');
const router = express.Router();
const customerHolidayMappingService = require('../../services/Masters/customerHolidayMapping.js');

router
.post('/get',customerHolidayMappingService.get)
.post('/create',customerHolidayMappingService.validate(),customerHolidayMappingService.create)
.put('/update',customerHolidayMappingService.validate(),customerHolidayMappingService.update)


module.exports = router;