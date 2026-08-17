const express = require('express');
const router = express.Router();
const inventorySubCategoryService = require('../../services/Inventory/inventorySubCategory');

router
.post('/get',inventorySubCategoryService.get)
.post('/getSubCategoryForTechnician',inventorySubCategoryService.getSubCategoryForTechnician)
.post('/create',inventorySubCategoryService.validate(),inventorySubCategoryService.create)
.put('/update',inventorySubCategoryService.validate(),inventorySubCategoryService.update)
.post('/importInventorySubCategory',inventorySubCategoryService.importInventorySubCategory)


module.exports = router;