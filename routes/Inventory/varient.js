const express = require('express');
const router = express.Router();
const varientService = require('../../services/Inventory/varient');

router
.post('/get',varientService.get)
.post('/create',varientService.validate(),varientService.create)
.put('/update',varientService.validate(),varientService.update)


module.exports = router;