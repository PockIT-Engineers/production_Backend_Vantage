const express = require('express');
const router = express.Router();
const customerTechnicianMapping = require('../../services/Masters/customerTechnicianMapping');

router
.post('/get',customerTechnicianMapping.get)
.post('/create',customerTechnicianMapping.validate(),customerTechnicianMapping.create)
.put('/update',customerTechnicianMapping.validate(),customerTechnicianMapping.update)
.post('/addBulk',customerTechnicianMapping.addBulk)
.post('/importCustomerTechnicianMapping',customerTechnicianMapping.importCustomerTechnicianMapping)


module.exports = router;