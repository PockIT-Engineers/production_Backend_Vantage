const express = require('express');
const router = express.Router();
const inventoryService = require('../../services/Inventory/inventory');
const inventoryImageMappingService = require('../../services/Inventory/inventoryImageMapping');

router
    .post('/get', inventoryService.get)//d
    .post('/getForCart', inventoryService.getForCart)//d
    .post('/getItemsForTechnician', inventoryService.getItemsForTechnician)//d
    .post('/getInventoryUniqueNo', inventoryService.getInventoryUniqueNo)//d
    .post('/getInventoryStock', inventoryService.getInventoryStock)//d
    .post('/getDetailedInventoryStock', inventoryService.getDetailedInventoryStock)//d
    .get('/getInventoryHirarchy', inventoryService.getInventoryHirarchy)//d
    .post('/getCustomItemHirarchy', inventoryService.getCustomItemHirarchy)//d
    .post('/create', inventoryService.validate(), inventoryService.createInventory)//d
    .post('/create1', inventoryService.validate(), inventoryService.create)//d
    .put('/update', inventoryService.validate(), inventoryService.update)//d
    .post('/addOrUpdateInventory', inventoryService.addOrUpdateInventory)//d
    .post('/mapUnitToInventory', inventoryService.mapUnitToInventory)//d
    .post('/updateStockforOrder', inventoryService.updateStockforOrder)
    .post('/:inventoryId/mapImagesToInventory', inventoryImageMappingService.mapImagesToInventory)//d
    .post('/:inventoryId/:id/deleteInventoryImage', inventoryImageMappingService.deleteInventoryImage)//d
    .post('/importInventory', inventoryService.importInventory)


module.exports = router;