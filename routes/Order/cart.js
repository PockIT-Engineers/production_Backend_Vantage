const express = require('express');
const router = express.Router();
const cartService = require('../../services/Order/cart');

router
    .post('/get', cartService.get)
    .post('/create', cartService.validate(), cartService.create)
    .put('/update', cartService.validate(), cartService.update)

    .post('/add', cartService.addToCart)
    .post('/getDetails', cartService.getCartDetails)
    .post('/service/delete', cartService.deleteCartItem)

    .post('/service/update', cartService.updateCartItem)


    .post('/updateDetails', cartService.updateServiceDetails)

    .post('/order/create', cartService.createOrder)
    .post('/discard', cartService.discardCart)
    .post('/slots/get', cartService.getSlots)
    .post('/coupons/get', cartService.getCouponList)
    .post('/coupon/apply', cartService.applyCoupon)
    .post('/coupon/remove', cartService.removeCoupon)

    //shop apis 


    .post('/product/delete', cartService.deleteCartItem)
    .post('/product/update', cartService.updateCartItem)
    .post('/address/update', cartService.updateAddress)


module.exports = router;