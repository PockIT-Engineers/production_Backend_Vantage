const express = require('express');
const router = express.Router();
const backofficeDepartmentMappingService = require('../../services/Masters/backofficeDepartmentMapping');

router
    .post('/get', backofficeDepartmentMappingService.get)
    .post('/create', backofficeDepartmentMappingService.validate(), backofficeDepartmentMappingService.create)
    .put('/update', backofficeDepartmentMappingService.validate(), backofficeDepartmentMappingService.update)
    .post('/addBulk', backofficeDepartmentMappingService.addBulk)


module.exports = router;