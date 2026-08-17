const express = require('express');
const router = express.Router();
const helpDocumentSubCategoryService = require('../../services/Masters/helpDocumentSubCategory');

router
.post('/get',helpDocumentSubCategoryService.get)
.post('/create',helpDocumentSubCategoryService.validate(),helpDocumentSubCategoryService.create)
.put('/update',helpDocumentSubCategoryService.validate(),helpDocumentSubCategoryService.update)

module.exports = router;