const express = require('express');
const router = express.Router();
const jobCardSchedulingDetailsService = require('../../services/Order/jobCardSchedulingDetails');

router
.post('/get',jobCardSchedulingDetailsService.get)
.post('/create',jobCardSchedulingDetailsService.validate(),jobCardSchedulingDetailsService.create)
.put('/update',jobCardSchedulingDetailsService.validate(),jobCardSchedulingDetailsService.update)


module.exports = router;