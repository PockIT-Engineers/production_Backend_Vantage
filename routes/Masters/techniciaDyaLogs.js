const express = require('express');
const router = express.Router();
const tectechniciaDyaLogs = require('../../services/Masters/tectechniciaDyaLogs');

router
.post('/get',tectechniciaDyaLogs.get)
.post('/getDateWiseLogs',tectechniciaDyaLogs.getDateWiseLogs)
.post('/create',tectechniciaDyaLogs.validate(),tectechniciaDyaLogs.create)
.put('/update',tectechniciaDyaLogs.validate(),tectechniciaDyaLogs.update)
.post('/addLog',tectechniciaDyaLogs.validate(),tectechniciaDyaLogs.addLog)


module.exports = router;