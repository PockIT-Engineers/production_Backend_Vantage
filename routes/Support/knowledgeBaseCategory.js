const express = require('express');
const router = express.Router();
const knowledgeBaseCategoryService = require('../../services/Support/knowledgeBaseCategory');

router
    .post('/get', knowledgeBaseCategoryService.get)
    .post('/create', knowledgeBaseCategoryService.validate(), knowledgeBaseCategoryService.create)
    .put('/update', knowledgeBaseCategoryService.validate(), knowledgeBaseCategoryService.update)

module.exports = router;