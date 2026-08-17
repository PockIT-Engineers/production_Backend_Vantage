const express = require('express');
const router = express.Router();
const jobCardTechnicianMappingService = require('../../services/Order/jobCardTechnicianMapping');

router
.post('/get',jobCardTechnicianMappingService.get)
.post('/create',jobCardTechnicianMappingService.validate(),jobCardTechnicianMappingService.create)
.put('/update',jobCardTechnicianMappingService.validate(),jobCardTechnicianMappingService.update)


module.exports = router;