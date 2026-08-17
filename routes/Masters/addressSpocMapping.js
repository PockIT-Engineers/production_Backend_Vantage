const express = require('express');
const router = express.Router();
const addressSpocMapping = require('../../services/Masters/addressSpocMapping');

router
.post('/get',addressSpocMapping.get)
.post('/create',addressSpocMapping.validate(),addressSpocMapping.create)
.post('/mapSpoctoAddress',addressSpocMapping.mapSpoctoAddress)
.put('/update',addressSpocMapping.validate(),addressSpocMapping.update)
.post('/importAddressSpocMapping',addressSpocMapping.importAddressSpocMapping)


module.exports = router;