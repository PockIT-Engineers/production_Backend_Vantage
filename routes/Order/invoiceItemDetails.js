const express = require('express');
const router = express.Router();
const invoiceItemDetailsService = require('../../services/Order/invoiceItemDetails');

router
.post('/get',invoiceItemDetailsService.get)
.post('/create',invoiceItemDetailsService.validate(),invoiceItemDetailsService.create)
.put('/update',invoiceItemDetailsService.validate(),invoiceItemDetailsService.update)


module.exports = router;