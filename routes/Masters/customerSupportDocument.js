const express = require('express');
const router = express.Router();
const customerSupportDocumentService = require('../../services/Masters/customerSupportDocument');

router
.post('/get', customerSupportDocumentService.get)
.post('/create', customerSupportDocumentService.validate(), customerSupportDocumentService.create)
.put('/update', customerSupportDocumentService.validate(), customerSupportDocumentService.update)

module.exports = router;
