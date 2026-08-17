const express = require('express');
const router = express.Router();
const technicianschedule = require('../../services/Order/technicianJobSchedule');

router
.post('/get',technicianschedule.get)
.post('/create',technicianschedule.validate(),technicianschedule.create)
.put('/update',technicianschedule.validate(),technicianschedule.update)
.post('/getJobCounts',technicianschedule.getJobCounts)
.post('/getTechnicians',technicianschedule.getTechniciansSchedule)
.post('/scheduleJob',technicianschedule.scheduleJob)
.post('/updateScheduleJob',technicianschedule.updateScheduleJob)


module.exports = router;