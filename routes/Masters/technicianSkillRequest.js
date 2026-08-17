const express = require('express');
const router = express.Router();
const technicianSkillRequestService = require('../../services/Masters/technicianSkillRequest');

router
.post('/get',technicianSkillRequestService.get)
.post('/create',technicianSkillRequestService.validate(),technicianSkillRequestService.create)
.put('/update',technicianSkillRequestService.validate(),technicianSkillRequestService.update)
.post('/updateSkillStatus',technicianSkillRequestService.updateSkillStatus)
.post('/getStatusCount',technicianSkillRequestService.getStatusCount)


module.exports = router;