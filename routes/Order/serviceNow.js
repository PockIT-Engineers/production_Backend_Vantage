const express = require('express');
const router = express.Router();
const serviceNow = require('../../services/Order/serviceNow');

router
    .post('/placeOrder', serviceNow.placeOrder)
    

module.exports = router;