const express = require('express');
const router = express.Router();
const technicianTimeTrackService = require('../../services/Order/technicianTimeTrack');

router
.post('/get',technicianTimeTrackService.get)
.post('/create',technicianTimeTrackService.validate(),technicianTimeTrackService.create)
.put('/update',technicianTimeTrackService.validate(),technicianTimeTrackService.update)


module.exports = router;