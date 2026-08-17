const express = require('express');
const router = express.Router();
const taxService = require('../../services/Masters/tax');

router
.post('/get',taxService.get)
.post('/create',taxService.validate(),taxService.create)
.put('/update',taxService.validate(),taxService.update)


module.exports = router;