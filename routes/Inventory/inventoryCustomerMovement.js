const express = require('express');
const router = express.Router();
const inventoryCustomerMovement = require('../../services/Inventory/inventoryCustomerMovement');
const inventoryCustomerMovementDetailsService = require('../../services/Inventory/inventoryCustomerMovementDetails');


router
.post('/get',inventoryCustomerMovement.getAll)//d
.post('/detailedList',inventoryCustomerMovement.detailedList)//d
.post('/create',inventoryCustomerMovement.validate(),inventoryCustomerMovement.create)//d
.put('/update',inventoryCustomerMovement.validate(),inventoryCustomerMovement.update)//d
.post('/createMovement',inventoryCustomerMovement.createMovement)//d
.post('/counts',inventoryCustomerMovement.counts)//d

.get('/:id/movementDetails',inventoryCustomerMovementDetailsService.movementDetails)//d
.get('/:id',inventoryCustomerMovement.get)//d
.get('/:id/movementList',inventoryCustomerMovementDetailsService.movementList)//d
.post('/getCustomers',inventoryCustomerMovementDetailsService.getCustomers)//D
.post('/getTechnicians',inventoryCustomerMovementDetailsService.getTechnicians)//D
.post('/getItemsToMovement',inventoryCustomerMovementDetailsService.getItemsToMovement)//D


module.exports = router;