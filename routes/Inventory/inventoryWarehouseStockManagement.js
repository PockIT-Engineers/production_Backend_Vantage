const express = require('express');
const router = express.Router();
const inventoryWarehouseStockManagementService = require('../../services/Inventory/inventoryWarehouseStockManagement');

router
.post('/get',inventoryWarehouseStockManagementService.get)
.post('/create',inventoryWarehouseStockManagementService.validate(),inventoryWarehouseStockManagementService.create)
.put('/update',inventoryWarehouseStockManagementService.validate(),inventoryWarehouseStockManagementService.update)


module.exports = router;