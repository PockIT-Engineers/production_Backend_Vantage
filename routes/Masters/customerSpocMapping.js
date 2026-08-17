const express = require('express');
const router = express.Router();
const customerSpocMapping = require('../../services/Masters/customerSpocMapping');

router
.post('/get',customerSpocMapping.get)
.post('/create',customerSpocMapping.validate(),customerSpocMapping.create)
.put('/update',customerSpocMapping.validate(),customerSpocMapping.update)
.post('/importCustomerSpocMapping',customerSpocMapping.importCustomerSpocMapping)


module.exports = router;