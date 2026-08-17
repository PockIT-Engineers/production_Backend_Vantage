const express = require('express');
const router = express.Router();
const excelMasterService = require('../../services/Masters/excelImportColumnJson.js');

router
.post('/get',excelMasterService.get)
.post('/create',excelMasterService.validate(),excelMasterService.create)
.put('/update',excelMasterService.validate(),excelMasterService.update)
.put('/uploadExcelRecord',excelMasterService.uploadExcelRecord)


module.exports = router;