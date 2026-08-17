const express = require('express');
const router = express.Router();
const customerProductFeedbackService = require('../../services/ShipModule/customerProductFeedback');

router
.post('/get',customerProductFeedbackService.get)
.post('/create',customerProductFeedbackService.validate(),customerProductFeedbackService.create)
.post('/addFeedback',customerProductFeedbackService.validate(),customerProductFeedbackService.addFeedback)
.put('/update',customerProductFeedbackService.validate(),customerProductFeedbackService.update)
.post('/getCustomerProductFeedback',customerProductFeedbackService.getCustomerProductFeedback)


module.exports = router;