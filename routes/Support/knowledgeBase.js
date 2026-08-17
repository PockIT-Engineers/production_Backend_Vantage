const express = require('express');
const router = express.Router();
const knowledgeBaseService = require('../../services/Support/knowledgeBase');

router
.post('/get',knowledgeBaseService.get)
.post('/create',knowledgeBaseService.validate(),knowledgeBaseService.create)
.put('/update',knowledgeBaseService.validate(),knowledgeBaseService.update)

module.exports = router;