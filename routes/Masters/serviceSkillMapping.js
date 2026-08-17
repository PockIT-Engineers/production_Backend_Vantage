const express = require('express');
const router = express.Router();
const serviceSkillMappingService = require('../../services/Masters/serviceSkillMapping');

router
.post('/get',serviceSkillMappingService.get)
.post('/create',serviceSkillMappingService.validate(),serviceSkillMappingService.create)
.put('/update',serviceSkillMappingService.validate(),serviceSkillMappingService.update)
.post('/addBulk',serviceSkillMappingService.addBulk)
.post('/importServiceSkillMapping',serviceSkillMappingService.importServiceSkillMapping)


module.exports = router;