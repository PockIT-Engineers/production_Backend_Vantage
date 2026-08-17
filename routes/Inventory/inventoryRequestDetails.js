const express = require('express');
const router = express.Router();
const inventoryRequestDetailsService = require('../../services/Inventory/inventoryRequestDetails');

router
.post('/get',inventoryRequestDetailsService.get)
.post('/create',inventoryRequestDetailsService.validate(),inventoryRequestDetailsService.create)
.put('/update',inventoryRequestDetailsService.validate(),inventoryRequestDetailsService.update)


module.exports = router;