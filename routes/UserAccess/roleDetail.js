const express = require('express');
const router = express.Router();
const roleDetailService = require('../../services/UserAccess/roleDetail');

router
    .post('/get', roleDetailService.get)
    .post('/create',roleDetailService.validate(),roleDetailService.create)
    .put('/update',roleDetailService.validate(),roleDetailService.update)
    .post('/addBulk', roleDetailService.addBulk)
    .post('/getData', roleDetailService.getMappingData)
    .post('/checkAccess', roleDetailService.checkAccess)

module.exports = router;