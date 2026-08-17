const express = require('express');
const router = express.Router();
const brandService = require('../../services/Masters/brand');

router
.post('/get',brandService.get)
.get('/:id/get',brandService.getList)
.post('/create',brandService.validate(),brandService.create)
.put('/update',brandService.validate(),brandService.update)
.post('/importBrand',brandService.importBrand)

module.exports = router;