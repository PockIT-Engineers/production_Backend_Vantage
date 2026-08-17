const express = require('express');
const router = express.Router();
const knowledgebaseSubCategoryService = require('../../services/Support/knowledgebaseSubCategory');

router
    .post('/get', knowledgebaseSubCategoryService.get)
    .post('/create', knowledgebaseSubCategoryService.validate(), knowledgebaseSubCategoryService.create)
    .put('/update', knowledgebaseSubCategoryService.validate(), knowledgebaseSubCategoryService.update)

module.exports = router;