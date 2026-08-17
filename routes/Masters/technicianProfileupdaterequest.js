const express = require('express');
const router = express.Router();
const technicianProfileUpdateRequestService = require('../../services/Masters/technicianProfileupdaterequest');

router
    .post('/get', technicianProfileUpdateRequestService.get)
    .post('/create', technicianProfileUpdateRequestService.validate(), technicianProfileUpdateRequestService.create)
    .put('/update', technicianProfileUpdateRequestService.validate(), technicianProfileUpdateRequestService.update)
    .post('/updateProfileStatus', technicianProfileUpdateRequestService.updateProfileStatus)
    .post('/verifyOtp', technicianProfileUpdateRequestService.verifyOTP)
module.exports = router;