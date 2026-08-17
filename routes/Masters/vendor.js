const express = require('express');
const router = express.Router();
const vendorService = require('../../services/Masters/vendor');

router
.post('/get',vendorService.get)
.post('/create',vendorService.validate(),vendorService.create)
.post('/createVendor',vendorService.validate(),vendorService.createVendor)
.put('/update',vendorService.validate(),vendorService.update)
.post('/updateVendor',vendorService.validate(),vendorService.updateVendor)
.post('/importVendor',vendorService.importVendor)


module.exports = router;