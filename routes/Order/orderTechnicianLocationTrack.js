const express = require('express');
const router = express.Router();
const orderTechnicianLocationTrackService = require('../../services/Order/orderTechnicianLocationTrack');

router
.post('/get',orderTechnicianLocationTrackService.get)
.post('/create',orderTechnicianLocationTrackService.validate(),orderTechnicianLocationTrackService.create)
.put('/update',orderTechnicianLocationTrackService.validate(),orderTechnicianLocationTrackService.update)


module.exports = router;