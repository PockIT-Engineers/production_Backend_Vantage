const express = require('express');
const router = express.Router();
const inventoryCategoryService = require('../../services/Inventory/inventoryCategory');

router
.post('/get',inventoryCategoryService.get)
.post('/getCategoryForTechnician',inventoryCategoryService.getCategoryForTechnician)
.post('/create',inventoryCategoryService.validate(),inventoryCategoryService.create)
.post('/getcatogoryHirechy',inventoryCategoryService.validate(),inventoryCategoryService.getcatogoryHirechy)
.put('/update',inventoryCategoryService.validate(),inventoryCategoryService.update)
.post('/importInventoryCategory',inventoryCategoryService.importInventoryCategory)



module.exports = router;