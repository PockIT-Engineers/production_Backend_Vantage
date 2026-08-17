const express = require('express');
const router = express.Router();
const customerService = require('../../services/Masters/customer');
const customerTechnicianMapping = require('../../services/Masters/customerTechnicianMapping');
const customerSpocMapping = require('../../services/Masters/customerSpocMapping');


router
    .post('/get', customerService.get)//d
    .post('/getCustomerDetails', customerService.getCustomerDetails)//d
    .post('/create', customerService.validate(), customerService.create)//d
    .put('/update', customerService.validate(), customerService.update)//d
    .post('/changePassword', customerService.changePassword)//d
    .post('/addCustomer', customerService.addCustomer)//tp
    .post('/logout', customerService.logout)//d
    .post('/forgetPassword', customerService.forgetPassword)//d
    .post('/unMappedTechnicians', customerService.unMappedTechnicians)//d
    .post('/mapTechnicians', customerTechnicianMapping.mapTechnicians)//d
    .post('/unMapTechnicians', customerTechnicianMapping.unMapTechnicians)//d
    .post('/deleteProfile', customerService.deleteProfile)//d
    .post('/activateProfile', customerService.activateProfile)//d
    .post('/unMappedSPOC', customerService.unMappedSPOC)//d
    .post('/mapSPOC', customerSpocMapping.mapSPOC)//d
    .post('/unMapSPOC', customerSpocMapping.unMapSPOC)//d
    .post('/getCompanyNames', customerService.getCompanyNames)//d
    .post('/importCustomer', customerService.importCustomer)
    .post('/getParanetWithChild', customerService.getParanetWithChild);//d


module.exports = router;
