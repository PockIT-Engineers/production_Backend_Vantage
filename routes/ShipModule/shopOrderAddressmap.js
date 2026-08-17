const express = require('express');
const router = express.Router();
const shopOrderAddressMapService = require('../../services/ShipModule/shopOrderAddressmap');

router
    .post('/get', shopOrderAddressMapService.getAll)
    .get('/:id', shopOrderAddressMapService.get)
    .post('/create', shopOrderAddressMapService.validate(), shopOrderAddressMapService.create)
    .put('/update', shopOrderAddressMapService.validate(), shopOrderAddressMapService.update)


module.exports = router;