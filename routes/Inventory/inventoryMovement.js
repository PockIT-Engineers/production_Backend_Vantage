const express = require('express');
const router = express.Router();
const inventoryMovementService = require('../../services/Inventory/inventoryMovement');
const inventoryMovementDetailsService = require('../../services/Inventory/inventoryMovementDetails');


router
.post('/get',inventoryMovementService.getAll)
.post('/detailedList',inventoryMovementService.detailedList)//d
.post('/create',inventoryMovementService.validate(),inventoryMovementService.create)
.put('/update',inventoryMovementService.validate(),inventoryMovementService.update)
.post('/createMovement',inventoryMovementService.createMovement)//d
.post('/counts',inventoryMovementService.counts)//d

.get('/:id/movementDetails',inventoryMovementDetailsService.movementDetails)
.get('/:id/movementList',inventoryMovementDetailsService.movementList)
.get('/:id',inventoryMovementService.get)

module.exports = router;