const express = require('express');
const router = express.Router();
const shopOrderService = require('../../services/ShipModule/shopOrder');

router
    .post('/get', shopOrderService.getAll)
    .get('/:id/orderDetails', shopOrderService.orderDetails)
    .post('/create', shopOrderService.validate(), shopOrderService.create)
    .put('/update', shopOrderService.validate(), shopOrderService.update)
    .post('/orderUpdateStatus', shopOrderService.orderUpdateStatus)
    .post('/courierServiceability', shopOrderService.courierServiceability)
    // .post('/shiprocketWebhook', shopOrderService.shiprocketWebhook)
    .get('/:shipment_id/trackThroughShipmentId', shopOrderService.trackThroughShipmentId)
    .get('/:order_id/trackThroughOrderId', shopOrderService.trackThroughOrderId)
    .get('/:awbCode/trackThroughAwbCode', shopOrderService.trackThroughAwbCode)
    .get('/:id', shopOrderService.get)


module.exports = router;