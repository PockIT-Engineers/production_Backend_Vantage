const express = require('express');
const router = express.Router();
const stateService = require('../../services/Masters/state');

router
.post('/get',stateService.get)
.post('/create',stateService.validate(),stateService.create)
.put('/update',stateService.validate(),stateService.update)
.post('/importState',stateService.importState)


module.exports = router;