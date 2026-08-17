const express = require('express');
const router = express.Router();
const shopOrderActionLog = require('../mongoServices/shopOrderActionLog');

router
    .post('/get', shopOrderActionLog.get)
    .post('/getDateWiseLogs', shopOrderActionLog.getDateWiseLogs)
    .post('/create', shopOrderActionLog.validate(), shopOrderActionLog.create)
    .put('/update', shopOrderActionLog.validate(), shopOrderActionLog.update)
    .post('/addLog', shopOrderActionLog.validate(), shopOrderActionLog.addLog)
    .post('/getorderLogsforCustomer', shopOrderActionLog.getorderLogsforCustomer)

module.exports = router;