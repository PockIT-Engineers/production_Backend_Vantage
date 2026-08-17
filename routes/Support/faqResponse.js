const express = require('express');
const router = express.Router();
const faqResponsesService = require('../../services/Support/faqResponse');

router
    .post('/get', faqResponsesService.get)
    .post('/create', faqResponsesService.validate(), faqResponsesService.create)
    .put('/update', faqResponsesService.validate(), faqResponsesService.update)

module.exports = router;