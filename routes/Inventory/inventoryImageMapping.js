const express = require('express');
const router = express.Router();
const inventoryImageMappingService = require('../../services/Inventory/inventoryImageMapping');

router
.post('/get',inventoryImageMappingService.get)
.post('/create',inventoryImageMappingService.validate(),inventoryImageMappingService.create)
.put('/update',inventoryImageMappingService.validate(),inventoryImageMappingService.update)


module.exports = router;