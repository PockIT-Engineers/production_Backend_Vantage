const express = require('express');
const router = express.Router();
const territoryServicenOnAvailabilityMappingService = require('../../services/Masters/territoryServicenOnAvailabilityMapping');

router
    .post('/get', territoryServicenOnAvailabilityMappingService.get)
    .post('/create', territoryServicenOnAvailabilityMappingService.validate(), territoryServicenOnAvailabilityMappingService.create)
    .put('/update', territoryServicenOnAvailabilityMappingService.validate(), territoryServicenOnAvailabilityMappingService.update)
    .post('/addBulk', territoryServicenOnAvailabilityMappingService.addBulk)
    .post('/serviceDetails', territoryServicenOnAvailabilityMappingService.serviceDetails)
    .post('/addBulkService', territoryServicenOnAvailabilityMappingService.addBulkService)
    .post('/mapNonServiceTeritory', territoryServicenOnAvailabilityMappingService.mapNonServiceTeritory)



module.exports = router;