const express = require('express');
const router = express.Router();
const bannerMasterService = require('../../services/Masters/banner');

router
    .post('/get', bannerMasterService.get)
    .post('/create', bannerMasterService.validate(), bannerMasterService.create)
    .put('/update', bannerMasterService.validate(), bannerMasterService.update)


module.exports = router;