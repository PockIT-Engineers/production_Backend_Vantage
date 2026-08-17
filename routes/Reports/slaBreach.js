const express = require('express');
const router = express.Router();
const slaBreachService = require('../../services/Reports/slaBreach.js');

router
    .post('/get', slaBreachService.get)
    .post('/updateSlaRemarks', slaBreachService.updateSlaRemarks);

module.exports = router;