const express = require('express');
const router = express.Router();
const customerEmailMappingService = require('../../services/Masters/customerEmailMapping');

router
.post('/get',customerEmailMappingService.get)
.post('/create',customerEmailMappingService.validate(),customerEmailMappingService.create)
.put('/update',customerEmailMappingService.validate(),customerEmailMappingService.update)
.post('/addBulk',customerEmailMappingService.addBulk)
.post('/importCustomerEmailMapping',customerEmailMappingService.importCustomerEmailMapping)


module.exports = router;