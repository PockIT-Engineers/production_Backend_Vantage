const express = require('express');
const router = express.Router();
const helpDocumentCategoryService = require('../../services/Masters/helpDocumentCategory');

router
    .post('/get', helpDocumentCategoryService.get)
    .post('/create', helpDocumentCategoryService.validate(), helpDocumentCategoryService.create)
    .put('/update', helpDocumentCategoryService.validate(), helpDocumentCategoryService.update)

module.exports = router;