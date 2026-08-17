const express = require('express');
const router = express.Router();
const customerConfigurationsService = require('../../services/Config/customerConfigurations');

router
.post('/get',customerConfigurationsService.get)
.post('/create',customerConfigurationsService.validate(),customerConfigurationsService.create)
.put('/update',customerConfigurationsService.validate(),customerConfigurationsService.update)


module.exports = router;