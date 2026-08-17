const express = require('express');
const router = express.Router();
const customerSlaService = require('../../services/Masters/customerSla');

router
.post('/get',customerSlaService.get)
.post('/create',customerSlaService.validate(),customerSlaService.create)
.put('/update',customerSlaService.validate(),customerSlaService.update)


module.exports = router;