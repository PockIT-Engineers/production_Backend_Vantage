const express = require('express');
const router = express.Router();
const invoiceService = require('../../services/Order/invoice');

router
.post('/get',invoiceService.get)
.post('/create',invoiceService.validate(),invoiceService.create)
.put('/update',invoiceService.validate(),invoiceService.update)
.post('/getInvoiceLogs',invoiceService.getInvoiceLogs)


module.exports = router;