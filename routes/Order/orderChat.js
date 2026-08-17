const express = require('express');
const router = express.Router();
const orderChatService = require('../../services/Order/orderChat');

router
.post('/get',orderChatService.get)
.post('/create',orderChatService.validate(),orderChatService.create)
.put('/update',orderChatService.validate(),orderChatService.update)


module.exports = router;