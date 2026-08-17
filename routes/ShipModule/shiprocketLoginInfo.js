const express = require('express');
const router = express.Router();
const shiprocketLoginInfoService = require('../../services/ShipModule/shiprocketLoginInfo');

router
.post('/get',shiprocketLoginInfoService.get)
.post('/create',shiprocketLoginInfoService.validate(),shiprocketLoginInfoService.create)
.put('/update',shiprocketLoginInfoService.validate(),shiprocketLoginInfoService.update)


module.exports = router;