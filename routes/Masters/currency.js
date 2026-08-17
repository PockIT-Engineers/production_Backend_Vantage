const express = require('express');
const router = express.Router();
const currencyService = require('../../services/Masters/currency');

router
.post('/get',currencyService.get)
.post('/create',currencyService.validate(),currencyService.create)
.put('/update',currencyService.validate(),currencyService.update)


module.exports = router;