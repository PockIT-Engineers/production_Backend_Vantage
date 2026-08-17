const express = require('express');
const router = express.Router();
const categoryService = require('../../services/Masters/category');

router
.post('/get',categoryService.get)
.post('/getCategory',categoryService.getCategory)
.post('/create',categoryService.validate(),categoryService.create)
.put('/update',categoryService.validate(),categoryService.update)
.post('/importCategory',categoryService.importCategory)


module.exports = router;