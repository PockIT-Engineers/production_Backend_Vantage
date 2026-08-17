const express = require('express');
const router = express.Router();
const inventoryCustomerMovementDetailsService = require('../../services/Inventory/inventoryCustomerMovementDetails');

router
.post('/get',inventoryCustomerMovementDetailsService.getAll)
.get('/:id',inventoryCustomerMovementDetailsService.get)
.post('/create',inventoryCustomerMovementDetailsService.validate(),inventoryCustomerMovementDetailsService.create)
.put('/update',inventoryCustomerMovementDetailsService.validate(),inventoryCustomerMovementDetailsService.update)


module.exports = router;