const express = require('express');
const router = express.Router();
const technicianLanguageMappingService = require('../../services/Masters/technicianLanguageMapping');

router
    .post('/get', technicianLanguageMappingService.get)
    .post('/create', technicianLanguageMappingService.validate(), technicianLanguageMappingService.create)
    .put('/update', technicianLanguageMappingService.validate(), technicianLanguageMappingService.update)
    .post('/addBulk', technicianLanguageMappingService.addBulk)
    .post('/updatePrimaryLanguage', technicianLanguageMappingService.updatePrimaryLanguage)


module.exports = router;