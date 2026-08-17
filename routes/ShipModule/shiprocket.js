const express = require('express');
const router = express.Router();
const shiprocketService = require('../../services/ShipModule/shiprocket');

router
    .post('/get', shiprocketService.get)


module.exports = router;