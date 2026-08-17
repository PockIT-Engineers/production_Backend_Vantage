const express = require('express');
const router = express.Router();
const serviceDocumemtMappingService = require('../../services/Masters/serviceDocumemtMapping');


router
.post('/get',serviceDocumemtMappingService.get)
.post('/create',serviceDocumemtMappingService.validate(),serviceDocumemtMappingService.create)
.put('/update',serviceDocumemtMappingService.validate(),serviceDocumemtMappingService.update)


module.exports = router;