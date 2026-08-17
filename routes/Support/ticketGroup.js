const express = require('express');
const router = express.Router();
const ticketGroupService = require('../../services/Support/ticketGroup');

router
    .post('/get', ticketGroupService.get)
    .post('/getTicketGroups', ticketGroupService.ticketGroups)
    .post('/create', ticketGroupService.validate(), ticketGroupService.create)
    .put('/update', ticketGroupService.validate(), ticketGroupService.update)
    .post('/getParent', ticketGroupService.getParent)

module.exports = router;