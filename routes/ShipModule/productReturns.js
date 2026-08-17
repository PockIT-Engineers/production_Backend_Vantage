const express = require('express');
const router = express.Router();
const productReturnsService = require('../../services/ShipModule/productReturns.js');

router
    .post('/get', productReturnsService.getAll)
    .get('/:id', productReturnsService.get)
    .post('/create', productReturnsService.validate(), productReturnsService.create)
    .put('/update', productReturnsService.validate(), productReturnsService.update)

module.exports = router;