const express = require('express');
const router = express.Router();
const orderMasterService = require('../../services/Order/order');

router
    .post('/get', orderMasterService.get)
    .post('/create', orderMasterService.validate(), orderMasterService.create)
    .post('/createOrder', orderMasterService.createOrder)
    .put('/update', orderMasterService.validate(), orderMasterService.update)
    .post('/getOrderDetails', orderMasterService.getOrderDetails)
    .post('/getPaymentOrdeDetails', orderMasterService.getPaymentOrdeDetails)
    .patch('/orderUpdateStatus', orderMasterService.orderUpdateStatus)//d
    .post('/getCategories',orderMasterService.getCategoriesHierarchy)//d
    .post('/getServices',orderMasterService.getServices)//d
    .post('/getServicesForWeb',orderMasterService.getServicesForWeb)//d
    .post('/updateDetails',orderMasterService.updateOrder)//d
    .post('/requestForReschedule',orderMasterService.requestForReschedule)//d
    .post('/updateOrderDiscription',orderMasterService.updateOrderDiscription)//d
    .post('/updateWorkOrderType',orderMasterService.updateWorkOrderType);//d
	
module.exports = router;