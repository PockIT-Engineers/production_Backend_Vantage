const express = require('express');
const router = express.Router();
const languageService = require('../../services/Masters/language');

router
.post('/get',languageService.get)
.post('/create',languageService.validate(),languageService.create)
.put('/update',languageService.validate(),languageService.update)


module.exports = router;