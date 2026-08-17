const express = require('express');
const router = express.Router();
const technicianSkillMappingService = require('../../services/Masters/technicianSkillMapping');

router
    .post('/get', technicianSkillMappingService.get)
    .post('/create', technicianSkillMappingService.validate(), technicianSkillMappingService.create)
    .put('/update', technicianSkillMappingService.validate(), technicianSkillMappingService.update)
    // .post('/addBulk',technicianSkillMappingService.addBulk)
    .post('/mapSkills', technicianSkillMappingService.mapSkills)
    .post('/unMapSkills', technicianSkillMappingService.unMapSkills)

module.exports = router;