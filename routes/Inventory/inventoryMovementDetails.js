const express = require('express');
const router = express.Router();
const inventoryMovementDetailsService = require('../../services/Inventory/inventoryMovementDetails');

router
.post('/get',inventoryMovementDetailsService.getAll)
.get('/:id',inventoryMovementDetailsService.get)
.post('/create',inventoryMovementDetailsService.validate(),inventoryMovementDetailsService.create)
.put('/update',inventoryMovementDetailsService.validate(),inventoryMovementDetailsService.update)


module.exports = router;