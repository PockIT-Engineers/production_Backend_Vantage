const express = require('express');
const router = express.Router();
const saveFilterService = require('../../services/Config/saveFilter');

router
.post('/get',saveFilterService.get)
.post('/create',saveFilterService.validate(),saveFilterService.create)
.put('/update',saveFilterService.validate(),saveFilterService.update)
.post('/delete/:id', saveFilterService.delete)


module.exports = router;