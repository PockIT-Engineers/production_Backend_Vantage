const express = require('express');
const router = express.Router();
const taxStateMappingService = require('../../services/Masters/taxStateMapping');

router
	.post('/get', taxStateMappingService.get)
	.post('/create', taxStateMappingService.validate(), taxStateMappingService.create)
	.put('/update', taxStateMappingService.validate(), taxStateMappingService.update)
	.post('/addBulk', taxStateMappingService.addBulk)


module.exports = router;
