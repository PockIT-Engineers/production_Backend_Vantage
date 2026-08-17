const express = require('express');
const router = express.Router();
const supportCategoryService = require('../../services/Support/supportCategory');

router
    .post('/get', supportCategoryService.get)
    .post('/create', supportCategoryService.validate(), supportCategoryService.create)
    .put('/update', supportCategoryService.validate(), supportCategoryService.update)

module.exports = router;