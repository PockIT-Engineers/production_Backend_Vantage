const express = require('express');
const router = express.Router();
const couponCodeInventoryMappingService = require('../../services/Masters/couponCodeInventoryMapping');

router
    .post('/get', couponCodeInventoryMappingService.get)
    .post('/create', couponCodeInventoryMappingService.validate(), couponCodeInventoryMappingService.create)
    .put('/update', couponCodeInventoryMappingService.validate(), couponCodeInventoryMappingService.update)


module.exports = router;