const express = require('express');
const router = express.Router();
const unitService = require('../../services/Masters/unit');

router
.post('/get',unitService.get)
.post('/create',unitService.validate(),unitService.create)
.put('/update',unitService.validate(),unitService.update)
.post('/importUnit',unitService.importUnit)


module.exports = router;