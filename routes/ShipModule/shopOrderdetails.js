const express = require('express');
const router = express.Router();
const shopOrderDetailsService = require('../../services/ShipModule/shopOrderdetails');

router
    .post('/get', shopOrderDetailsService.getAll)
    .get('/:id', shopOrderDetailsService.get)
    .post('/create', shopOrderDetailsService.validate(), shopOrderDetailsService.create)
    .put('/update', shopOrderDetailsService.validate(), shopOrderDetailsService.update)


module.exports = router;