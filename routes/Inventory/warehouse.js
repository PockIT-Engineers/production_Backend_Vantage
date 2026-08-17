const express = require('express');
const router = express.Router();
const warehouseService = require('../../services/Inventory/warehouse');

router
.post('/get',warehouseService.get)
.post('/create',warehouseService.validate(),warehouseService.createWarehouse)
.put('/update',warehouseService.validate(),warehouseService.update)


module.exports = router;