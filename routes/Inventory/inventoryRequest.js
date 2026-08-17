const express = require('express');
const router = express.Router();
const inventoryRequestService = require('../../services/Inventory/inventoryRequest');

router
.post('/get',inventoryRequestService.get)
.post('/create',inventoryRequestService.validate(),inventoryRequestService.create)
.put('/update',inventoryRequestService.validate(),inventoryRequestService.update)
.post('/addInventory',inventoryRequestService.addInventory)
.post('/updateRequestStatus',inventoryRequestService.validate(),inventoryRequestService.updateRequestStatus)



module.exports = router;