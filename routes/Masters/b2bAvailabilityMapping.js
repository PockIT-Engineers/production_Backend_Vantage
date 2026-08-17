const express = require('express');
const router = express.Router();
const b2BAvailabilityMappingService = require('../../services/Masters/b2bAvailabilityMapping');

router
    .post('/get', b2BAvailabilityMappingService.get)
    .post('/create', b2BAvailabilityMappingService.validate(), b2BAvailabilityMappingService.create)
    .put('/update', b2BAvailabilityMappingService.validate(), b2BAvailabilityMappingService.update)
    .post('/mapServicesCustomer', b2BAvailabilityMappingService.mapServicesCustomer)
    .post('/addBulkService', b2BAvailabilityMappingService.addBulkService)
    .put('/updateB2BService', b2BAvailabilityMappingService.validate(), b2BAvailabilityMappingService.updateB2BService)
    .post('/importB2BAvailabilityMapping', b2BAvailabilityMappingService.importB2BAvailabilityMapping);


module.exports = router;