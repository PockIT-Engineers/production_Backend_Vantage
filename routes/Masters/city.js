const express = require('express');
const router = express.Router();
const cityService = require('../../services/Masters/city');

router
.post('/get',cityService.get)
.post('/create',cityService.validate(),cityService.create)
.put('/update',cityService.validate(),cityService.update)


module.exports = router;