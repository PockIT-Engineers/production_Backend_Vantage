const express = require('express');
const router = express.Router();
const shiprocketWebhookLogsService = require('../../services/ShipModule/shiprocketWebhookLogs.js');

router
    .get('/:id', shiprocketWebhookLogsService.get)
    .post('/get', shiprocketWebhookLogsService.getAll)
    .post('/create', shiprocketWebhookLogsService.validate(), shiprocketWebhookLogsService.create)
    .put('/update', shiprocketWebhookLogsService.validate(), shiprocketWebhookLogsService.update)

module.exports = router;