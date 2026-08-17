const express = require('express');
const router = express.Router();
const jobCardChatDetailsService = require('../../services/Order/jobcardchatdetails');

router
.post('/get',jobCardChatDetailsService.get)
.post('/create',jobCardChatDetailsService.validate(),jobCardChatDetailsService.create)
.put('/update',jobCardChatDetailsService.validate(),jobCardChatDetailsService.update)


module.exports = router;