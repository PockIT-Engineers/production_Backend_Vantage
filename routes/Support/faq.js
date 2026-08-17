const express = require('express');
const router = express.Router();
const faqService = require('../../services/Support/faq');

router
    .post('/get', faqService.get)
    .post('/create', faqService.validate(), faqService.create)
    .put('/update', faqService.validate(), faqService.update)
    .post('/markHelpfull', faqService.markHelpfulCount)
    .post('/searchFaq', faqService.searchFaq)
    .post('/importFaq', faqService.importFaq)

module.exports = router;