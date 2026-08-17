const express = require('express');
const router = express.Router();
const technicianService = require('../../services/Masters/technician');
const technicianPincodeMappingService = require('../../services/Masters/technicianPincodeMapping');
const technicianSkillMappingService = require('../../services/Masters/technicianSkillMapping');

router
    .post('/get', technicianService.get)//d
    .post('/getData', technicianService.getdata)//d
    .post('/create', technicianService.validate(), technicianService.create)//d
    .post('/getCalenderData', technicianService.getCalenderData)//New
    .put('/update', technicianService.validate(), technicianService.update)//d
    .post('/changePassword', technicianService.changePassword)
    .post('/createTechnician', technicianService.createTechnician)//d
    .post('/updateTechnician', technicianService.updateTechnician)//d

    .post('/unMappedpincodes', technicianService.unMappedpincodes)//d
    .post('/mapPincodes', technicianPincodeMappingService.mapPincodes)//d
    .post('/unMapPincodes', technicianPincodeMappingService.unMapPincodes)//d

    .post('/unMappedSkills', technicianService.unMappedSkills)//d
    .post('/mapSkills', technicianSkillMappingService.mapSkills)//d
    .post('/unMapSkills', technicianSkillMappingService.unMapSkills)//d

    .post('/getTechnicianCalendar', technicianService.getTechnicianCalendar)//d
    .post('/dayTrack', technicianService.dayTrack)
    .post('/getDayTrack', technicianService.getDayTrack)//d
    .post('/updateJobStatus', technicianService.updateJobStatus)
    .post('/updateJobStatusByGuest', technicianService.updateJobStatusByGuest)
    .post('/getInvoice', technicianService.getInvoice)
    .post('/logout', technicianService.logout)//d
    .post('/updateTechnicianProfile', technicianService.updateTechnicianProfile)
    .post('/verifyOTP', technicianService.verifyProfileOTP)
    .post('/clearId', technicianService.clearId)//d
    .post('/checkEmail', technicianService.checkEmail)//d
    .post('/getUnAvailablityOfTechnician', technicianService.getUnAvailablityOfTechnician)
    .post('/verifyandCompleteByAdmin', technicianService.verifyandCompleteByAdmin)
    .post('/completeJobByGuestTechnician', technicianService.completeJobByGuestTechnician)
    .post('/updateJobStatusByGuestTechnician', technicianService.updateJobStatusByGuestTechnician)



    //import

    .post('/importTechnician', technicianService.importTechnician)
    .post('/importSkillMapping', technicianService.importSkillMapping)
    .post('/importTechnicianWeeklyCalendar', technicianService.importTechnicianWeeklyCalendar)
    .post('/importTechnicianPincodeMapping', technicianService.importTechnicianPincodeMapping)

module.exports = router;