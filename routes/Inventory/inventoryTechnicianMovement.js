const express = require('express');
const router = express.Router();
const inventoryTechnicianMovement = require('../../services/Inventory/inventoryTechnicianMovement');
const inventoryTechnicianMovementDetailsService = require('../../services/Inventory/inventoryTechnicianMovementDetails');


router
.post('/get',inventoryTechnicianMovement.getAll)
.post('/detailedList',inventoryTechnicianMovement.detailedList)//d
.post('/create',inventoryTechnicianMovement.validate(),inventoryTechnicianMovement.create)
.put('/update',inventoryTechnicianMovement.validate(),inventoryTechnicianMovement.update)
.post('/createMovement',inventoryTechnicianMovement.createMovement)//d
.post('/counts',inventoryTechnicianMovement.counts)

.get('/:id/movementDetails',inventoryTechnicianMovementDetailsService.movementDetails)
.get('/:id',inventoryTechnicianMovement.get)
.get('/:id/movementList',inventoryTechnicianMovementDetailsService.movementList)


module.exports = router;