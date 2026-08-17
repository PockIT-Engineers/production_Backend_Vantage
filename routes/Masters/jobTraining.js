const express = require('express');
const router = express.Router();
const jobTrainingService = require('../../services/Masters/jobTraining');

router
    .post('/get', jobTrainingService.get)
    .post('/getTrainingServices', jobTrainingService.getTrainingServices)
    .post('/create', jobTrainingService.validate(), jobTrainingService.create)
    .put('/update', jobTrainingService.validate(), jobTrainingService.update)

module.exports = router;