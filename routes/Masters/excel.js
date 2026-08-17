const express = require('express');
const router = express.Router();
const excelMasterService = require('../../Services/Masters/excel.js');

router
.post('/get',excelMasterService.get)
.post('/getImportDetails',excelMasterService.getImportDetails)
.post('/create',excelMasterService.validate(),excelMasterService.create)
.put('/update',excelMasterService.validate(),excelMasterService.update)


module.exports = router;