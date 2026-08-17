const express = require('express');
const router = express.Router();
const couponTypeService = require('../../services/Masters/couponType');

router
.post('/get',couponTypeService.get)
.post('/create',couponTypeService.validate(),couponTypeService.create)
.put('/update',couponTypeService.validate(),couponTypeService.update)


module.exports = router;