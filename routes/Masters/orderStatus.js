const express = require('express');
const router = express.Router();
const orderStatusService = require('../../services/Masters/orderStatus');

router
.post('/get',orderStatusService.get)
.post('/create',orderStatusService.validate(),orderStatusService.create)
.put('/update',orderStatusService.validate(),orderStatusService.update)


module.exports = router;