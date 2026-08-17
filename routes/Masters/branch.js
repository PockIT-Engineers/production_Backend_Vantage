const express = require('express');
const router = express.Router();
const branchService = require('../../services/Masters/branch');

router
.post('/get',branchService.get)
.post('/create',branchService.validate(),branchService.create)
.put('/update',branchService.validate(),branchService.update)


module.exports = router;