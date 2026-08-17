const express = require('express');
const router = express.Router();
const tectechniciaDyaLogs = require('../mongoServices/technicainDayLog');

router
    .post('/get', tectechniciaDyaLogs.get)
    .post('/getDateWiseLogs', tectechniciaDyaLogs.getDateWiseLogs)
    .post('/create', tectechniciaDyaLogs.validate(), tectechniciaDyaLogs.create)
    .put('/update', tectechniciaDyaLogs.validate(), tectechniciaDyaLogs.update)
    .post('/addLog', tectechniciaDyaLogs.validate(), tectechniciaDyaLogs.addLog)
    .post('/getTechnicianTimeSheet', tectechniciaDyaLogs.getTechnicianTimeSheet)


module.exports = router;