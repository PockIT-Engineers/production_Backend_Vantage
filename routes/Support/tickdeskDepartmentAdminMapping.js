const express = require('express');
const router = express.Router();
const tickdeskDeprtmentAdminMappingService = require('../../services/Support/tickdeskDeprtmentAdminMapping');

router
    .post('/get', tickdeskDeprtmentAdminMappingService.get)
    .post('/create', tickdeskDeprtmentAdminMappingService.validate(), tickdeskDeprtmentAdminMappingService.create)
    .put('/update', tickdeskDeprtmentAdminMappingService.validate(), tickdeskDeprtmentAdminMappingService.update)
    .post('/addBulk', tickdeskDeprtmentAdminMappingService.validate(), tickdeskDeprtmentAdminMappingService.addBulk)

module.exports = router;