const express = require('express');
const router = express.Router();
const jobCardStatusService = require('../../services/Masters/jobCardStatus');

router
.post('/get',jobCardStatusService.get)
.post('/create',jobCardStatusService.validate(),jobCardStatusService.create)
.put('/update',jobCardStatusService.validate(),jobCardStatusService.update)


module.exports = router;