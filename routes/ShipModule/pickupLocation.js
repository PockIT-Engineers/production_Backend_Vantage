const express = require('express');
const router = express.Router();
const pickupLocationService = require('../../services/ShipModule/pickupLocation');

router
.post('/get',pickupLocationService.get)
.post('/create',pickupLocationService.validate(),pickupLocationService.create)
.put('/update',pickupLocationService.validate(),pickupLocationService.update)


module.exports = router;