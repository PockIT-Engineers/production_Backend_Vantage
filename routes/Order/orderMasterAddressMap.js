const express = require('express');
const router = express.Router();
const orderMasterAddressMapService = require('../../services/Order/orderMasterAddressMap');

router
.post('/get',orderMasterAddressMapService.get)
.post('/create',orderMasterAddressMapService.validate(),orderMasterAddressMapService.create)
.put('/update',orderMasterAddressMapService.validate(),orderMasterAddressMapService.update)


module.exports = router;