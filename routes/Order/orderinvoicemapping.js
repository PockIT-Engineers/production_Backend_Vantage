const express = require('express');
const router = express.Router();
const orderInvoiceMappingService = require('../../services/Order/orderinvoicemapping');

router
.post('/get',orderInvoiceMappingService.get)
.post('/create',orderInvoiceMappingService.validate(),orderInvoiceMappingService.create)
.put('/update',orderInvoiceMappingService.validate(),orderInvoiceMappingService.update)


module.exports = router;