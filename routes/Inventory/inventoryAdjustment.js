const express = require('express');
const router = express.Router();
const inventoryAdjustmentService = require('../../services/Inventory/inventoryAdjustment');

router
.post('/get',inventoryAdjustmentService.get)
.post('/create',inventoryAdjustmentService.validate(),inventoryAdjustmentService.create)
.put('/update',inventoryAdjustmentService.validate(),inventoryAdjustmentService.update)
.post('/adjustmentInventory',inventoryAdjustmentService.validate(),inventoryAdjustmentService.adjustmentInventory)


module.exports = router;