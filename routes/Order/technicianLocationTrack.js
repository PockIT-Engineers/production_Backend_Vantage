const express = require('express');
const router = express.Router();
const technicianLocationTrackService = require('../../services/Order/technicianLocationTrack');

router
.post('/get',technicianLocationTrackService.get)
.post('/create',technicianLocationTrackService.validate(),technicianLocationTrackService.create)
.put('/update',technicianLocationTrackService.validate(),technicianLocationTrackService.update)
.post('/getTechnicianLocations',technicianLocationTrackService.getTechnicianLocations)
.post('/getTechnicianLocationsByFilter',technicianLocationTrackService.getTechnicianLocationsByFilter)


module.exports = router;