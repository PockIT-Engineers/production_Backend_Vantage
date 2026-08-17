const express = require('express');
const router = express.Router();
const subCategoryService = require('../../services/Masters/subCategory');

router
.post('/get',subCategoryService.get)
.post('/create',subCategoryService.validate(),subCategoryService.create)
.put('/update',subCategoryService.validate(),subCategoryService.update)
.post('/importSubCategory',subCategoryService.importSubCategory)


module.exports = router;