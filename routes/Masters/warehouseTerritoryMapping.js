const express = require('express');
const router = express.Router();
const warehouseTerritoryMappingService = require('../../services/Masters/warehouseTerritoryMapping');

router
.post('/get',warehouseTerritoryMappingService.get)
.post('/create',warehouseTerritoryMappingService.validate(),warehouseTerritoryMappingService.create)
.put('/update',warehouseTerritoryMappingService.validate(),warehouseTerritoryMappingService.update)
.post('/addBulk',warehouseTerritoryMappingService.addBulk)


module.exports = router;