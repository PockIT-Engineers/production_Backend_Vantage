const express = require('express');
const router = express.Router();
const emailTemplateService = require('../../services/Masters/emailTemplate');

router
.post('/get',emailTemplateService.get)
.post('/create',emailTemplateService.validate(),emailTemplateService.create)
.put('/update',emailTemplateService.validate(),emailTemplateService.update)


module.exports = router;