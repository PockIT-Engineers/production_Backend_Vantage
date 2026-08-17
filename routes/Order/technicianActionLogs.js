const express = require('express');
const router = express.Router();
const technicianActionLogsService = require('../../services/Order/technicianActionLogs');

router
.post('/get',technicianActionLogsService.get)
.post('/create',technicianActionLogsService.validate(),technicianActionLogsService.create)
.put('/update',technicianActionLogsService.validate(),technicianActionLogsService.update)
.post('/getDateWiseLogs',technicianActionLogsService.getDateWiseLogs)
.post('/getorderLogsforCustomer',technicianActionLogsService.getorderLogsforCustomer)


module.exports = router;