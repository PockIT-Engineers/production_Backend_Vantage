const express = require('express');
const router = express.Router();
const tickdeskSupportUserMappingService = require('../../services/Support/tickdeskSupportUserMapping');

router
    .post('/get', tickdeskSupportUserMappingService.get)
    .post('/create', tickdeskSupportUserMappingService.validate(), tickdeskSupportUserMappingService.create)
    .put('/update', tickdeskSupportUserMappingService.validate(), tickdeskSupportUserMappingService.update)
    .post('/addBulk', tickdeskSupportUserMappingService.validate(), tickdeskSupportUserMappingService.addBulk)

module.exports = router;