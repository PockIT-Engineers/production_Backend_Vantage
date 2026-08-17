const express = require('express');
const router = express.Router();
const pincodeService = require('../../services/Masters/pincode');

router
.post('/get',pincodeService.get)
.post('/create',pincodeService.validate(),pincodeService.create)
.put('/update',pincodeService.validate(),pincodeService.update)
.post('/importPincode',pincodeService.importPincode)


module.exports = router;