const express = require('express');
const router = express.Router();
const jobCardChatService = require('../../services/Order/jobcardchat');

router
.post('/get',jobCardChatService.get)
.post('/create',jobCardChatService.validate(),jobCardChatService.create)
.put('/update',jobCardChatService.validate(),jobCardChatService.update)


module.exports = router;