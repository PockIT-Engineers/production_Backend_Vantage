const express = require('express');
const router = express.Router();
const ticketTransferReport = require('../../services/Reports/ticketTransferReport');

router
    .post('/get', ticketTransferReport.get)

module.exports = router;

