const express = require('express');
const router = express.Router();
const serviceItemService = require('../../services/Masters/service');
const serviceSkillMappingService = require('../../services/Masters/serviceSkillMapping');

router
    .post('/get', serviceItemService.get)//d
    .get('/getPoppulerServices', serviceItemService.getPoppulerServices)
    .post('/getServiceLogs', serviceItemService.getServiceLogs)
    .post('/getData', serviceItemService.getData)
    .post('/create', serviceItemService.validate(), serviceItemService.create)//d
    .put('/update', serviceItemService.validate(), serviceItemService.update)//d
    .post('/serviceHirarchy', serviceItemService.serviceHirarchy)
    .post('/serviceList', serviceItemService.serviceList)

    .post('/unMappedSkills', serviceItemService.unMappedSkills)//d
    .post('/mapSkills', serviceSkillMappingService.mapSkills)//d
    .post('/unMapSkills', serviceSkillMappingService.unMapSkills)//d    
    .post('/getMappedServices', serviceItemService.getMappedServices)
    .post('/getServiceHirechy', serviceItemService.getServiceHirechy)

    .post('/b2bserviceList', serviceItemService.b2bserviceList)
    .post('/getb2bServiceHirechy', serviceItemService.getb2bServiceHirechy)
    .get('/getCategories', serviceItemService.getCategoriesHierarchy)
    .post('/importService', serviceItemService.importService)


module.exports = router;