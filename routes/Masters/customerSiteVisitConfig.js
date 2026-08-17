const express = require('express');
const router = express.Router();
const customerSiteVisitConfigService = require('../../services/Masters/customerSiteVisitConfig');

router
.post('/get',customerSiteVisitConfigService.get)
.post('/create',customerSiteVisitConfigService.validate(),customerSiteVisitConfigService.create)
.put('/update',customerSiteVisitConfigService.validate(),customerSiteVisitConfigService.update)


module.exports = router;