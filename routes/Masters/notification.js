const express = require('express');
const router = express.Router();
const notificationService = require('../../services/Masters/notification');

router
    .post('/get', notificationService.get)
    .post('/create', notificationService.validate(), notificationService.create)
    .put('/update', notificationService.validate(), notificationService.update)
    .post('/sendNotification', notificationService.sendNotification)
    .post('/subscribeMultiple', notificationService.subscribeMultiple)
    .post('/unsubscribeMultiple', notificationService.unsubscribeMultiple)

module.exports = router;