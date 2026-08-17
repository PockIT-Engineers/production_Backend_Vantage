const express = require('express');
const router = express.Router();
const customerCategoryService = require('../../services/Masters/customerCategory');

router
.post('/get',customerCategoryService.get)
.post('/create',customerCategoryService.validate(),customerCategoryService.create)
.put('/update',customerCategoryService.validate(),customerCategoryService.update)


module.exports = router;