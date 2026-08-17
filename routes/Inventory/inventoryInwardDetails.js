const express = require('express');
const router = express.Router();
const inventoryInwardDetailsService = require('../../services/Inventory/inventoryInwardDetails');

router
.post('/get',inventoryInwardDetailsService.getAll)
.get('/:id',inventoryInwardDetailsService.get)
.post('/create',inventoryInwardDetailsService.validate(),inventoryInwardDetailsService.create)
.put('/update',inventoryInwardDetailsService.validate(),inventoryInwardDetailsService.update)


module.exports = router;