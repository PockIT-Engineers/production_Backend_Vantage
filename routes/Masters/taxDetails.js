const express = require('express');
const router = express.Router();
const taxDetailsService = require('../../services/Masters/taxDetails');

router
.post('/get',taxDetailsService.get)
.post('/create',taxDetailsService.validate(),taxDetailsService.create)
.put('/update',taxDetailsService.validate(),taxDetailsService.update)
.post('/getTaxDetails',taxDetailsService.getTaxDetails)

module.exports = router;