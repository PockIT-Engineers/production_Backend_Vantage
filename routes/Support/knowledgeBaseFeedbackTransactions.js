const express = require('express');
const router = express.Router();
const knowledgeBaseFeedbackTransactionsService = require('../../services/Support/knowledgeBaseFeedbackTransactions');

router
    .post('/get', knowledgeBaseFeedbackTransactionsService.get)
    .post('/create', knowledgeBaseFeedbackTransactionsService.validate(), knowledgeBaseFeedbackTransactionsService.create)
    .put('/update', knowledgeBaseFeedbackTransactionsService.validate(), knowledgeBaseFeedbackTransactionsService.update)

module.exports = router;