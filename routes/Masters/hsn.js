const express = require('express');
const router = express.Router();
const hsnMasterService = require('../../services/Masters/hsn');

router
    .post('/get', hsnMasterService.get)
    .post('/create', hsnMasterService.validate(), hsnMasterService.create)
    .put('/update', hsnMasterService.validate(), hsnMasterService.update)
        .post('/importHSN', hsnMasterService.importHSN)


module.exports = router;