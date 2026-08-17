const express = require('express');
const router = express.Router();
const technicianConfigurationsService = require('../../services/Masters/technicianConfigurations');

router
.post('/get',technicianConfigurationsService.get)
.post('/create',technicianConfigurationsService.validate(),technicianConfigurationsService.create)
.put('/update',technicianConfigurationsService.validate(),technicianConfigurationsService.update)


module.exports = router;