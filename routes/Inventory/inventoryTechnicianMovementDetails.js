const express = require('express');
const router = express.Router();
const inventoryTechnicianMovementDetailsService = require('../../services/Inventory/inventoryTechnicianMovementDetails');

router
.post('/get',inventoryTechnicianMovementDetailsService.getAll)
.get('/:id',inventoryTechnicianMovementDetailsService.get)
.post('/create',inventoryTechnicianMovementDetailsService.validate(),inventoryTechnicianMovementDetailsService.create)
.put('/update',inventoryTechnicianMovementDetailsService.validate(),inventoryTechnicianMovementDetailsService.update)


module.exports = router;