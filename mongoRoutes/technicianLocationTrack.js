const express = require("express");
const router = express.Router();
const technicianLocationTrackService = require("../mongoServices/technicianLocationTrack");

router
    .post("/get", technicianLocationTrackService.get)
    .post("/create", technicianLocationTrackService.validate(), technicianLocationTrackService.create)
    .put("/update", technicianLocationTrackService.validate(), technicianLocationTrackService.update)
    .post('/getTechnicianLocationsByFilter', technicianLocationTrackService.getTechnicianLocationsByFilter)
    .post('/getTechnicianLocations', technicianLocationTrackService.getTechnicianLocations)


module.exports = router;
