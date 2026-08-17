const express = require('express');
const router = express.Router();
const jobCardInventoryMappingService = require('../../services/Order/jobCardInventoryMapping');

router
.post('/get',jobCardInventoryMappingService.get)
.post('/create',jobCardInventoryMappingService.validate(),jobCardInventoryMappingService.create)
.put('/update',jobCardInventoryMappingService.validate(),jobCardInventoryMappingService.update)


module.exports = router;