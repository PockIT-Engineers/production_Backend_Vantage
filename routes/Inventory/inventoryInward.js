const express = require('express');
const router = express.Router();
const inventoryInwardService = require('../../services/Inventory/inventoryInward');
const inventoryInwardDetailsService = require('../../services/Inventory/inventoryInwardDetails');


router
.post('/get',inventoryInwardService.getAll)
.post('/create',inventoryInwardService.validate(),inventoryInwardService.create)
.put('/update',inventoryInwardService.validate(),inventoryInwardService.update)
.post('/inwardInventory',inventoryInwardService.inwardInventory)
.get('/:id/inwardDetails',inventoryInwardDetailsService.inwardDetails)
.get('/:id',inventoryInwardService.get)


module.exports = router;