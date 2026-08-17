const express = require('express');
const router = express.Router();
const customerServiceFeedbackService = require('../../services/Order/customerservicefeedback');

router
.post('/get',customerServiceFeedbackService.get)
.post('/create',customerServiceFeedbackService.validate(),customerServiceFeedbackService.create)
.put('/update',customerServiceFeedbackService.validate(),customerServiceFeedbackService.update)
.post('/getCustomerServiceFeedback',customerServiceFeedbackService.getCustomerServiceFeedback)


module.exports = router;