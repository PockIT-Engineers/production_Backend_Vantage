const express = require('express');
const router = express.Router();
const appLanguageService = require('../../services/Masters/appLanguage');

router
.post('/get',appLanguageService.getAll)
.post('/create',appLanguageService.validate(),appLanguageService.create)
.put('/update',appLanguageService.validate(),appLanguageService.update)
.post('/addAppLanguage',appLanguageService.validate(),appLanguageService.addAppLanguage)
.post('/saveAsDraft',appLanguageService.validate(),appLanguageService.saveAsDraft)
.post('/saveAsFinal',appLanguageService.validate(),appLanguageService.saveAsFinal)
.get('/:id/getAppLanguageMaster',appLanguageService.getAppLanguageMaster)
.get('/:id',appLanguageService.get)


module.exports = router;