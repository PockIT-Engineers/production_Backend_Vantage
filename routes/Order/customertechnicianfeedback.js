const express = require('express');
const router = express.Router();
const customerTechnicianFeedbackService = require('../../services/Order/customertechnicianfeedback')

router
    .post('/get', customerTechnicianFeedbackService.get)
    .post('/create', customerTechnicianFeedbackService.validate(), customerTechnicianFeedbackService.create)
    .put('/update', customerTechnicianFeedbackService.validate(), customerTechnicianFeedbackService.update)
    .post('/getcustomerTechnicianFeedback', customerTechnicianFeedbackService.getCustomerTechnicianFeedback)
    .post('/technicianServiceFeedbackByCustomer', customerTechnicianFeedbackService.technicianServiceFeedbackByCustomer)


module.exports = router;