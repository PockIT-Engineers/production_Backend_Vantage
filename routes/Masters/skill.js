const express = require('express');
const router = express.Router();
const skillService = require('../../services/Masters/skill');

router
    .post('/get', skillService.get)
    .post('/create', skillService.validate(), skillService.create)
    .put('/update', skillService.validate(), skillService.update)
    .post('/unmappedSkills', skillService.unmappedSkills)
    .post('/importSkill', skillService.importSkill)

module.exports = router;