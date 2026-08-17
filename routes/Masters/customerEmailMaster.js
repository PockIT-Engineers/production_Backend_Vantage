const express = require('express');
const router = express.Router();
const customerEmailMasterService = require('../../services/Masters/customerEmailMaster');

router
.post('/get',customerEmailMasterService.get)
.post('/create',customerEmailMasterService.validate(),customerEmailMasterService.create)
.put('/update',customerEmailMasterService.validate(),customerEmailMasterService.update)
.post('/createDetails',customerEmailMasterService.validate(),customerEmailMasterService.createDetails)
.post('/updateDetails',customerEmailMasterService.validate(),customerEmailMasterService.updateDetails)


module.exports = router;