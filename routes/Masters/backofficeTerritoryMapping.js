const express = require('express');
const router = express.Router();
const backofficeTerritoryMappingService = require('../../services/Masters/backofficeTerritoryMapping');

router
.post('/get',backofficeTerritoryMappingService.get)
.post('/create',backofficeTerritoryMappingService.validate(),backofficeTerritoryMappingService.create)
.put('/update',backofficeTerritoryMappingService.validate(),backofficeTerritoryMappingService.update)
.post('/addBulk',backofficeTerritoryMappingService.addBulk)


module.exports = router;