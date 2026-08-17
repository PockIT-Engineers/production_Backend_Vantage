const express = require('express');
const router = express.Router();
const inventoryAccountTransactionService = require('../../services/Inventory/inventoryAccountTransaction');

router
.post('/get',inventoryAccountTransactionService.get)
.post('/create',inventoryAccountTransactionService.validate(),inventoryAccountTransactionService.create)
.put('/update',inventoryAccountTransactionService.validate(),inventoryAccountTransactionService.update)


module.exports = router;