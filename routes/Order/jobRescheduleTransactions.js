const express = require('express');
const router = express.Router();
const jobRescheduleTransactionsService = require('../../services/Order/jobRescheduleTransactions');

router
    .post('/get', jobRescheduleTransactionsService.get)
    .post('/getCounts', jobRescheduleTransactionsService.getCounts)
    .post('/create', jobRescheduleTransactionsService.validate(), jobRescheduleTransactionsService.create)
    .put('/update', jobRescheduleTransactionsService.validate(), jobRescheduleTransactionsService.update)
    .post('/updateStatus', jobRescheduleTransactionsService.updateStatus)
    .post('/RefundStatus', jobRescheduleTransactionsService.RefundStatus)
    .post('/bulkRescheduleByTechnician', jobRescheduleTransactionsService.bulkRescheduleByTechnician)



module.exports = router;