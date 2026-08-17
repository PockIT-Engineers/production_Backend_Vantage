const express = require('express');
const router = express.Router();
const supportSubCategoryService = require('../../services/Support/supportSubCategory');

router
    .post('/get', supportSubCategoryService.get)
    .post('/create', supportSubCategoryService.validate(), supportSubCategoryService.create)
    .put('/update', supportSubCategoryService.validate(), supportSubCategoryService.update)

module.exports = router;