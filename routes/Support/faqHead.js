const express = require('express');
const router = express.Router();
const faqHeadService = require('../../services/Support/faqHead');

router
    .post('/get', faqHeadService.get)
    .post('/create', faqHeadService.validate(), faqHeadService.create)
    .put('/update', faqHeadService.validate(), faqHeadService.update)
    .post('/importFaqHead', faqHeadService.importFaqHead)

module.exports = router;