const express = require('express');
const router = express.Router();
const orderChatDetailsService = require('../../services/Order/orderChatDetails');

router
.post('/get',orderChatDetailsService.get)
.post('/create',orderChatDetailsService.validate(),orderChatDetailsService.create)
.put('/update',orderChatDetailsService.validate(),orderChatDetailsService.update)


module.exports = router;