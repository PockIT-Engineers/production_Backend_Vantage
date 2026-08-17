const express = require('express');
const router = express.Router();
const tempalteCategoryService = require('../../services/Config/tempaltecategory');

router
    .post('/get', tempalteCategoryService.get)
    .post('/create', tempalteCategoryService.validate(), tempalteCategoryService.create)
    .put('/update', tempalteCategoryService.validate(), tempalteCategoryService.update)


module.exports = router;