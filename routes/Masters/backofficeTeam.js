const express = require('express');
const router = express.Router();
const backofficeTeamService = require('../../services/Masters/backofficeTeam');
const backofficeDepartmentMappingService = require('../../services/Masters/backofficeDepartmentMapping');

router
    .post('/get', backofficeTeamService.get)
    .post('/create', backofficeTeamService.validate(), backofficeTeamService.create)
    .post('/createTeam', backofficeTeamService.validate(), backofficeTeamService.createTeam)
    .put('/update', backofficeTeamService.validate(), backofficeTeamService.update)
    .post('/updateTeam', backofficeTeamService.validate(), backofficeTeamService.updateTeam)
    .post('/mapDepartment', backofficeDepartmentMappingService.mapDepartment)
    .post('/unMapDepartment', backofficeDepartmentMappingService.unMapDepartment)
    .post('/unMappedDepartment', backofficeDepartmentMappingService.unMappedDepartment)
    .post('/importTeam', backofficeTeamService.importTeam)



module.exports = router;