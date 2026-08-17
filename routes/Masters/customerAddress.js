const express = require('express');
const router = express.Router();
const customerAddressService = require('../../services/Masters/customerAddress');

router
    .post('/get', customerAddressService.get)
    .post('/create', customerAddressService.validate(), customerAddressService.create)
    .post('/createAddress', customerAddressService.validate(), customerAddressService.createAddress)//ceated on 25-03-2025
    .put('/update', customerAddressService.validate(), customerAddressService.update)
    .post('/updateAddressDefault', customerAddressService.updateAddressDefault)
    .put('/updateAddress', customerAddressService.validate(), customerAddressService.updateAddress)
    .post('/deleteAddress', customerAddressService.validate(), customerAddressService.deleteAddress)
    .post('/importCustomerAddress', customerAddressService.importCustomerAddress)



module.exports = router;