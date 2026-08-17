const express = require('express');
const router = express.Router();
const globalSettingsService = require('../services/globalSettings');

router
    .post('/getVersion', globalSettingsService.getVersion)
    .put('/updatedVersion', globalSettingsService.updatedVersion)
    .post('/getVestionUpdatedHistory', globalSettingsService.getVestionUpdatedHistory)

module.exports = router;