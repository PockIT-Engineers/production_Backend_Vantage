const express = require('express');
const router = express.Router();
const jobCardService = require('../../services/Order/jobCard');

router
.post('/get',jobCardService.get)
.post('/getJobsforDispatcher',jobCardService.getJobsforDispatcher)
.post('/create',jobCardService.validate(),jobCardService.create)
.post('/createJobCard',jobCardService.validate(),jobCardService.createJobCard)
.post('/getAssignedJobs',jobCardService.getAssignedJobs)
.post('/getBetweenJobs',jobCardService.getBetweenJobs)
.post('/getJobsForTechnician',jobCardService.getJobsForTechnician)
.put('/update',jobCardService.validate(),jobCardService.update)
.post('/getjobDetailsWithFeedback',jobCardService.getjobDetailsWithFeedback)
.post('/updatePaymentStatus',jobCardService.updatePaymentStatus)



module.exports = router;