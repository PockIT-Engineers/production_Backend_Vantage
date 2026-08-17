const express = require('express');
const router = express.Router();
const cartItemDetailsService = require('../../services/Order/cartItemDetails');

router
.post('/get',cartItemDetailsService.get)
.post('/create',cartItemDetailsService.validate(),cartItemDetailsService.create)
.put('/update',cartItemDetailsService.validate(),cartItemDetailsService.update)


module.exports = router;