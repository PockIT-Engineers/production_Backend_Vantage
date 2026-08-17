const express = require('express');
const router = express.Router();
const invoicePaymentDetailsService = require('../../services/Order/invoicepaymentdetails');

router
.post('/get',invoicePaymentDetailsService.get)
.post('/create',invoicePaymentDetailsService.validate(),invoicePaymentDetailsService.create)
.put('/update',invoicePaymentDetailsService.validate(),invoicePaymentDetailsService.update)
.post('/getPaymentTransactions',invoicePaymentDetailsService.getPaymentTransactions)
.post('/addPaymentTransactions',invoicePaymentDetailsService.addPaymentTransactions)


module.exports = router;