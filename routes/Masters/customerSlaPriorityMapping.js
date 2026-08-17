const express = require('express');
const router = express.Router();
const customerSlaPriorityMappingService = require('../../services/Masters/customerSlaPriorityMapping');

router
    .post('/get', customerSlaPriorityMappingService.get)
    .post('/create', customerSlaPriorityMappingService.validate(), customerSlaPriorityMappingService.create)
    .put('/update', customerSlaPriorityMappingService.validate(), customerSlaPriorityMappingService.update)
    .post('/mapPrioritytoSla', customerSlaPriorityMappingService.mapPrioritytoSla)//D
    .post('/getPrioritytoData', customerSlaPriorityMappingService.getPrioritytoData)
    .post('/importPrioritytoSla', customerSlaPriorityMappingService.importPrioritytoSla)


module.exports = router;