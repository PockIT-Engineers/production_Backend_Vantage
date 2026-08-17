const express = require('express');
const router = express.Router();
const organisationService = require('../../services/Masters/organisation');

router
.post('/get',organisationService.get)
.post('/getData',organisationService.getdata)
.post('/create',organisationService.validate(),organisationService.create)
.post('/createOrg',organisationService.validate(),organisationService.createOrg)
.put('/update',organisationService.validate(),organisationService.update)
.post('/updateOrg',organisationService.validate(),organisationService.updateOrg)


module.exports = router;