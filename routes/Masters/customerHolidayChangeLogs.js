const express = require('express');
const router = express.Router();
const customerHolidayChangeLogsService = require('../../services/Masters/customerHolidayChangeLogs.js');

router
  .post('/get', customerHolidayChangeLogsService.get)
  .post('/create', customerHolidayChangeLogsService.validate(), customerHolidayChangeLogsService.create)
  .put('/update', customerHolidayChangeLogsService.validate(), customerHolidayChangeLogsService.update)

module.exports = router;
