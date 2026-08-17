const express = require('express');
const router = express.Router();
const ticketService = require('../../services/Support/ticket');

router
    .post('/get', ticketService.get)
    .post('/create', ticketService.validate(), ticketService.create)
    .put('/update', ticketService.validate(), ticketService.update)
    .post('/getDashboardReport', ticketService.getDashboardReport)//D
    .post('/getDepartmentwiseReport', ticketService.getDepartmentwiseReport)//D
    .post('/getUserwiseReport', ticketService.getUserwiseReport)//D
    .post('/getTicketReport', ticketService.getTicketReport)//D
    .post('/getLogDetails', ticketService.getLogDetails)//DS
    .post('/getLogDetailsByTicketNo', ticketService.getLogDetailsByTicketNo)//D
    .post('/getOptionWiseCount', ticketService.getOptionWiseCount)//D
    .post('/getAutoCloseTicketReport', ticketService.getAutoCloseTicketReport)
    .post('/getGroupWiseAutoCloseTicketCount', ticketService.getGroupWiseAutoCloseTicketCount)//d
    .post('/getCreatorWiseAutoCloseTicketCount', ticketService.getCreatorWiseAutoCloseTicketCount)//D
    .post('/getGroupWiseAutoCloseTicketReport', ticketService.getGroupWiseAutoCloseTicketReport)//D

module.exports = router;