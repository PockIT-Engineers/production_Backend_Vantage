const express = require('express');
const router = express.Router();
const technicianCustomerFeedbackService = require('../../services/Order/techniciancustomerfeedback');

router
.post('/get',technicianCustomerFeedbackService.get)
.post('/create',technicianCustomerFeedbackService.validate(),technicianCustomerFeedbackService.create)
.put('/update',technicianCustomerFeedbackService.validate(),technicianCustomerFeedbackService.update)
.post('/getTechnicianCustomerFeedback', technicianCustomerFeedbackService.getTechnicianCustomerFeedback)

module.exports = router;