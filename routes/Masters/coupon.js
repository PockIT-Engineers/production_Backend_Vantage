const express = require('express');
const router = express.Router();
const couponService = require('../../services/Masters/coupon');
 
router
    .post('/get', couponService.get)
    .post('/create', couponService.validate(), couponService.create)
    .put('/update', couponService.validate(), couponService.update)
 
    .post('/services/add', couponService.addServices)
    .post('/services/get', couponService.getServices)
 
    .post('/inventory/add', couponService.addInventory)
    .post('/inventory/get', couponService.getInventory)
 
    .post('/territory/add', couponService.addTerritories)
    .post('/territory/get', couponService.getTerritories)
 
module.exports = router;