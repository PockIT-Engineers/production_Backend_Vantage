const express = require('express');
const router = express.Router();
const inventoryTransactionsService = require('../../services/Inventory/inventoryTransactions');

router
.post('/get',inventoryTransactionsService.get)
.post('/create',inventoryTransactionsService.validate(),inventoryTransactionsService.create)
.put('/update',inventoryTransactionsService.validate(),inventoryTransactionsService.update)


module.exports = router;