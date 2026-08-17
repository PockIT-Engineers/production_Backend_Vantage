const express = require('express');
const router = express.Router();
const vendorTerritoryMappingService = require('../../services/Masters/vendorTerritoryMapping');

router
    .post('/get', vendorTerritoryMappingService.get)
    .post('/create', vendorTerritoryMappingService.validate(), vendorTerritoryMappingService.create)
    .put('/update', vendorTerritoryMappingService.validate(), vendorTerritoryMappingService.update)
    .post('/mapTerritorytoVendor', vendorTerritoryMappingService.mapTerritorytoVendor)


module.exports = router;