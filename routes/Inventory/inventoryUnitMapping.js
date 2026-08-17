const express = require('express');
const router = express.Router();
const inventoryUnitMappingService = require('../../services/Inventory/inventoryUnitMapping');

router
.post('/get',inventoryUnitMappingService.get)
.post('/create',inventoryUnitMappingService.validate(),inventoryUnitMappingService.create)
.put('/update',inventoryUnitMappingService.validate(),inventoryUnitMappingService.update)


module.exports = router;